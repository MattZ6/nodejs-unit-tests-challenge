import { InMemoryUsersRepository } from '../../repositories/in-memory/InMemoryUsersRepository';
import { ShowUserProfileError } from './ShowUserProfileError';
import { ShowUserProfileUseCase } from './ShowUserProfileUseCase';

let inMemoryUsersRepository: InMemoryUsersRepository;

/** System Under Test */
let showUserProfileUseCase: ShowUserProfileUseCase;

describe('ShowUserProfileUseCase', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();

    showUserProfileUseCase = new ShowUserProfileUseCase(inMemoryUsersRepository);
  });

  it('should not be able to get profile data for a non-existing user', async () => {
    const promise = showUserProfileUseCase.execute('non-existing-user-id');

    await expect(promise).rejects.toBeInstanceOf(ShowUserProfileError);
  });

  it('should be able to get profile data of an existing user', async () => {
    const name = 'John Doe';
    const email = 'johndoe@email.com';

    const user = await inMemoryUsersRepository.create({
      name,
      email,
      password: 'johndoespass',
    });

    const result = await showUserProfileUseCase.execute(user.id!);

    expect(result.name).toBe(name);
    expect(result.email).toBe(email);
  });
});
