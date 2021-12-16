import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { OperationType } from "../../entities/Statement";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { TransferError } from "./CreateStatementError";
import { TransferUseCase } from "./TransferUseCase";

let inMemoryUsersRepository: InMemoryUsersRepository;
let inMemoryStatementsRepository: InMemoryStatementsRepository;

/** System Under Test */
let transferUseCase: TransferUseCase;

describe('TransferUseCase', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    inMemoryStatementsRepository = new InMemoryStatementsRepository();

    transferUseCase = new TransferUseCase(
      inMemoryUsersRepository,
      inMemoryStatementsRepository,
    );
  });

  it('should not be able to trasnfer from a non-existing user', async () => {
    const promise = transferUseCase.execute({
      sender_id: 'non-existing-user-id',
      receiver_id: 'receiver-id',
      amount: 500,
      description: 'any-transfer-description',
    });

    await expect(promise).rejects.toBeInstanceOf(TransferError.UserNotFound);
  });

  it('should not be able to trasnfer to a non-existing user', async () => {
    const sender = await inMemoryUsersRepository.create({
      name: 'John Doe',
      email: 'john@doe.com',
      password: 'any-password',
    });

    const promise = transferUseCase.execute({
      sender_id: sender.id!,
      receiver_id: 'non-existing-user-id',
      amount: 500,
      description: 'any-transfer-description',
    });

    await expect(promise).rejects.toBeInstanceOf(TransferError.UserNotFound);
  });

  it('should not be able to transfer with insuficient funds', async () => {
    const sender = await inMemoryUsersRepository.create({
      name: 'John Doe',
      email: 'johndoe@email.com',
      password: 'any-password'
    });

    const receiver = await inMemoryUsersRepository.create({
      name: 'Jane Doe',
      email: 'janedoe@email.com',
      password: 'any-password'
    });

    const promise = transferUseCase.execute({
      sender_id: sender.id!,
      receiver_id: receiver.id!,
      amount: 500,
      description: 'any-transfer-description',
    });

    await expect(promise).rejects.toBeInstanceOf(TransferError.InsufficientFunds);
  });

  it('should be able to transfer', async () => {
    const sender = await inMemoryUsersRepository.create({
      name: 'John Doe',
      email: 'johndoe@email.com',
      password: 'any-password'
    });

    await inMemoryStatementsRepository.create({
      user_id: sender.id!,
      amount: 500,
      type: OperationType.DEPOSIT,
      description: 'any-transfer-description',
    });

    const receiver = await inMemoryUsersRepository.create({
      name: 'Jane Doe',
      email: 'janedoe@email.com',
      password: 'any-password'
    });

    const transfer = await transferUseCase.execute({
      sender_id: sender.id!,
      receiver_id: receiver.id!,
      amount: 500,
      description: 'any-transfer-description',
    });

    expect(transfer).toHaveProperty('id');
    expect(transfer).toHaveProperty('type', 'transfer');
    expect(transfer).toHaveProperty('sender_id', sender.id);
    expect(transfer).toHaveProperty('user_id', receiver.id);
  });
});
