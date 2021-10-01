import { hash } from 'bcryptjs';

import { InMemoryUsersRepository } from '../../repositories/in-memory/InMemoryUsersRepository';
import { AuthenticateUserUseCase } from './AuthenticateUserUseCase';
import { IncorrectEmailOrPasswordError } from './IncorrectEmailOrPasswordError';

let inMemoryUsersRepository: InMemoryUsersRepository;

/** System Under Test */
let authenticateUserUseCase: AuthenticateUserUseCase;

describe('AuthenticateUserUseCase', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();

    authenticateUserUseCase = new AuthenticateUserUseCase(inMemoryUsersRepository);
  });

  it('should not be able to authenticate a non-existing user', async () =>  {
    const promise = authenticateUserUseCase.execute({
      email: 'nonexisting@email.com',
      password: 'nonexistinguserpassword',
    });

    await expect(promise).rejects.toBeInstanceOf(IncorrectEmailOrPasswordError);
  });

  it('should not be able to authenticate a user with wrong password', async () => {
    const email = 'johndoe@email.com';

    await inMemoryUsersRepository.create({
      name: 'John Doe',
      email,
      password: 'johndoespass',
    });

    const promise = authenticateUserUseCase.execute({
      email,
      password: 'wrongpass',
    });

    await expect(promise).rejects.toBeInstanceOf(IncorrectEmailOrPasswordError);
  });

  it('should be able to authenticate an existing user', async () => {
    const email = 'johndoe@email.com';
    const password = 'johndoespassword';

    const passwordHash = await hash(password, 8);

    await inMemoryUsersRepository.create({
      name: 'John Doe',
      email,
      password: passwordHash,
    });

    const result = await authenticateUserUseCase.execute({
      email,
      password,
    });

    expect(result.user.email).toBe(email);
    expect(result).toHaveProperty('token');
  });
});
