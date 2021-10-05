import { v4 as generateUuid } from 'uuid';
import { hash } from 'bcryptjs';
import request from 'supertest';
import { Connection } from 'typeorm';

import { app } from '../../../../app';
import createConnection from '../../../../database';

let connection: Connection;

describe('AuthenticateUserController', () => {
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

  it('should not be able to authenticate a non-existing user', async () => {
    const response = await request(app)
      .post('/api/v1/sessions')
      .send({
        email: 'johndoe@email.com',
        password: 'johndoepass',
      });

    expect(response.status).toBe(401);
  });

  it('should not be able to authenticate a user with wrong password', async () => {
    const email = 'johndoe@email.com';
    const password = 'johndoepass';

    const id = generateUuid();
    const passwordHash = await hash(password, 8);

    await connection.query(`
      INSERT INTO users(id, name, email, password) VALUES('${id}', 'John Doe', '${email}', '${passwordHash}')
    `);

    const response = await request(app)
      .post('/api/v1/sessions')
      .send({
        email,
        password: 'wrong_password',
      });

    expect(response.status).toBe(401);
  });

  it('should be able to authenticate an existing user', async () => {
    const email = 'johndoe@email.com';
    const password = 'johndoepass';

    const id = generateUuid();
    const passwordHash = await hash(password, 8);

    await connection.query(`
      INSERT INTO users(id, name, email, password) VALUES('${id}', 'John Doe', '${email}', '${passwordHash}')
    `);

    const response = await request(app)
      .post('/api/v1/sessions')
      .send({
        email,
        password,
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('user');
    expect(response.body).toHaveProperty('user.email', email);
  });
});
