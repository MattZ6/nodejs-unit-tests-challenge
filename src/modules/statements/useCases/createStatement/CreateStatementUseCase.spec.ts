import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { CreateStatementError } from "./CreateStatementError";
import { CreateStatementUseCase } from "./CreateStatementUseCase";

let inMemoryUsersRepository: InMemoryUsersRepository;
let inMemoryStatementsRepository: InMemoryStatementsRepository;

/** System Under Test */
let createStatementUseCase: CreateStatementUseCase;

describe('CreateStatementUseCase', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    inMemoryStatementsRepository = new InMemoryStatementsRepository();

    createStatementUseCase = new CreateStatementUseCase(
      inMemoryUsersRepository,
      inMemoryStatementsRepository,
    );
  });

  it('should not be able to create a new statement for a non-existing user', async () => {
    const promise = createStatementUseCase.execute({
      user_id: 'non-existing-user-id',
      amount: 2_000,
      description: 'Salary',
      type: "deposit" as any,
    });

    await expect(promise).rejects.toBeInstanceOf(CreateStatementError.UserNotFound);
  });

  it('should not be able to create a new withdraw statement with insuficient funds', async () => {
    const { id } = await inMemoryUsersRepository.create({
      name: 'John Doe',
      email: 'johndoe@email.com',
      password: 'johndoespass'
    });

    const promise = createStatementUseCase.execute({
      user_id: id!,
      amount: 100,
      description: 'Market',
      type: "withdraw" as any,
    });

    await expect(promise).rejects.toBeInstanceOf(CreateStatementError.InsufficientFunds);
  });

  it('should be able to create new statements', async () => {
    const { id } = await inMemoryUsersRepository.create({
      name: 'John Doe',
      email: 'johndoe@email.com',
      password: 'johndoespass'
    });

    const depositStatementOperationAmout = 1000;
    const depositStatementOperationDescription = 'Salary';

    const depositStatementOperation = await createStatementUseCase.execute({
      user_id: id!,
      amount: depositStatementOperationAmout,
      description: depositStatementOperationDescription,
      type: "deposit" as any,
    });

    expect(depositStatementOperation).toHaveProperty('id');
    expect(depositStatementOperation.amount).toBe(depositStatementOperationAmout);
    expect(depositStatementOperation.description).toBe(depositStatementOperationDescription);
    expect(depositStatementOperation.type).toBe("deposit");

    const withdrawStatementOperationAmout = 1000;
    const withdrawStatementOperationDescription = 'Market';

    const withdrawStatementOperation = await createStatementUseCase.execute({
      user_id: id!,
      amount: withdrawStatementOperationAmout,
      description: withdrawStatementOperationDescription,
      type: "withdraw" as any,
    });

    expect(withdrawStatementOperation).toHaveProperty('id');
    expect(withdrawStatementOperation.amount).toBe(withdrawStatementOperationAmout);
    expect(withdrawStatementOperation.description).toBe(withdrawStatementOperationDescription);
    expect(withdrawStatementOperation.type).toBe("withdraw");
  });
});
