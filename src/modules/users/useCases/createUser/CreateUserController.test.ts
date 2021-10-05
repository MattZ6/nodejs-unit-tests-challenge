import request from 'supertest';
import { Connection } from "typeorm";

import { app } from '../../../../app';
import createConnection from '../../../../database';

let connection: Connection;

describe('CreateUserController', () => {
  beforeAll(async () => {
    connection = await createConnection('localhost');

    await connection.runMigrations();
  });

  beforeEach(async () => {
    await connection.query(`DELETE FROM users`);
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it("should not be able to create a user with another user's email address", async () => {
    const email = 'johndoe@email.com';

    await request(app)
    .post('/api/v1/users')
    .send({
      name: 'John Doe',
      email,
      password: 'johndoepass',
    });

    const response = await request(app)
      .post('/api/v1/users')
      .send({
        name: 'John Doe',
        email,
        password: 'johndoepass',
      });

    expect(response.status).toBe(400);
  });

  it('should be able to create a new user', async () => {
    const response = await request(app)
      .post('/api/v1/users')
      .send({
        name: 'John Doe',
        email: 'johndoe@email.com',
        password: 'johndoepass',
      });

    expect(response.status).toBe(201);
  });
});
