import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { GetBalanceError } from "./GetBalanceError";
import { GetBalanceUseCase } from "./GetBalanceUseCase";

let inMemoryStatementsRepository: InMemoryStatementsRepository;
let inMemoryUsersRepository: InMemoryUsersRepository;

/** System Under Test */
let getBalanceUseCase: GetBalanceUseCase;

describe('GetBalanceUseCase', () => {
  beforeEach(() => {
    inMemoryStatementsRepository = new InMemoryStatementsRepository();
    inMemoryUsersRepository = new InMemoryUsersRepository();

    getBalanceUseCase = new GetBalanceUseCase(
      inMemoryStatementsRepository,
      inMemoryUsersRepository,
    );
  });

  it('should not be able to get statement balance of a non-existing user', async () => {
    const promise = getBalanceUseCase.execute({
      user_id: 'non-existing-user-id',
    });

    await expect(promise).rejects.toBeInstanceOf(GetBalanceError);
  });

  it("should be able to get user's statements balance", async () => {
    const { id } = await inMemoryUsersRepository.create({
      name: 'John Doe',
      email: 'johndoe@email.com',
      password: 'johndoespass',
    });

    const statements = await Promise.all([
      inMemoryStatementsRepository.create({
        user_id: id!,
        amount: 1000,
        description: 'Salary',
        type: 'deposit' as any,
      }),
      inMemoryStatementsRepository.create({
        user_id: id!,
        amount: 500,
        description: 'Market',
        type: 'withdraw' as any,
      }),
      inMemoryStatementsRepository.create({
        user_id: id!,
        amount: 1500,
        description: 'Freela',
        type: 'deposit' as any,
      }),
    ]);

    const result = await getBalanceUseCase.execute({ user_id: id! });

    expect(result.balance).toBe(2000);
    expect(result.statement).toHaveLength(statements.length);
  });
});
