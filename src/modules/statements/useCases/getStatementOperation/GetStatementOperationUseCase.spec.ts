import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { GetStatementOperationError } from "./GetStatementOperationError";
import { GetStatementOperationUseCase } from "./GetStatementOperationUseCase";

let inMemoryUsersRepository: InMemoryUsersRepository;
let inMemoryStatementsRepository: InMemoryStatementsRepository;

/** System Under Test */
let getStatementOperationUseCase: GetStatementOperationUseCase;

describe('GetStatementOperationUseCase', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    inMemoryStatementsRepository = new InMemoryStatementsRepository();

    getStatementOperationUseCase = new GetStatementOperationUseCase(
      inMemoryUsersRepository,
      inMemoryStatementsRepository,
    );
  });

  it('should not be able to get statement operation data of a non-existing user', async () => {
    const promise = getStatementOperationUseCase.execute({
      user_id: 'non-existing-user-id',
      statement_id: 'statement-id',
    });

    await expect(promise).rejects.toBeInstanceOf(GetStatementOperationError.UserNotFound);
  });

  it('should not be able to get data of a non-existing statement', async () => {
    const { id } = await inMemoryUsersRepository.create({
      name: 'John Doe',
      email: 'johndoe@email.com',
      password: 'johndoespass',
    });

    const promise = getStatementOperationUseCase.execute({
      user_id: id!,
      statement_id: 'non-existing-statement-operation-id',
    });

    await expect(promise).rejects.toBeInstanceOf(GetStatementOperationError.StatementNotFound);
  });

  it('should be able to get statement operation data from a user', async () => {
    const { id: userId } = await inMemoryUsersRepository.create({
      name: 'John Doe',
      email: 'johndoe@email.com',
      password: 'johndoespass',
    });

    const amount = 1000;
    const description = 'Salary';
    const type = 'deposit' as any;

    const { id: statementOperationId } = await inMemoryStatementsRepository.create({
      user_id: userId!,
      amount,
      description,
      type,
    });

    const result = await getStatementOperationUseCase.execute({
      user_id: userId!,
      statement_id: statementOperationId!,
    });

    expect(result.id).toBe(statementOperationId);
    expect(result.amount).toBe(amount);
    expect(result.description).toBe(description);
    expect(result.type).toBe(type);
  });
});
