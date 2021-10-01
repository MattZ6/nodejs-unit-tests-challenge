import { InMemoryUsersRepository } from '../../repositories/in-memory/InMemoryUsersRepository';
import { CreateUserError } from './CreateUserError';
import { CreateUserUseCase } from './CreateUserUseCase';

let inMemoryUsersRepository: InMemoryUsersRepository;

/** System Under Test */
let createUserUseCase: CreateUserUseCase;

describe('CreateUseUseCase', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();

    createUserUseCase = new CreateUserUseCase(inMemoryUsersRepository);
  });

  it("should not be able to create a user with another user's email address", async () => {
    const user = await inMemoryUsersRepository.create({
      name: 'John Doe',
      email: 'johndoe@email.com',
      password: 'johndoespass'
    });

    const promise = createUserUseCase.execute({
      name: user.name,
      email: user.email,
      password: user.password,
    });

    await expect(promise).rejects.toBeInstanceOf(CreateUserError);
  });

  it('should be able to create a new user', async () => {
    const name = 'John Doe';
    const email = 'johndoe@email.com';
    const password = 'johndoespass';

    const result = await createUserUseCase.execute({
      name,
      email,
      password,
    });

    expect(result).toHaveProperty('id');
    expect(result.name).toBe(name);
    expect(result.email).toBe(email);
    expect(result.password).not.toBe(password);
  });
});
