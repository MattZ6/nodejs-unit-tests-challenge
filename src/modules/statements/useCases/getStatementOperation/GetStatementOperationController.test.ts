import request from 'supertest';
import { Connection } from 'typeorm';
import { sign } from 'jsonwebtoken';
import { v4 as generateUuid } from 'uuid';

import { app } from '../../../../app';
import createConnection from '../../../../database';
import authConfig from '../../../../config/auth';

let connection: Connection;

describe('GetStatementOperationController', () => {
  beforeAll(async () => {
    connection = await createConnection('localhost');

    await connection.runMigrations();
  });

  beforeEach(async () => {
    await connection.query(`DELETE FROM users`);
    await connection.query(`DELETE FROM statements`);
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it('should not be able to get statement operation of a non-existing user', async () => {
    const { secret, expiresIn } = authConfig.jwt;

    const accessToken = sign({ }, secret, {
      subject: generateUuid(),
      expiresIn,
    });

    const response = await request(app)
      .get('/api/v1/statements/statement-id')
      .set({ Authorization: `Bearer ${accessToken}` })
      .send();

    expect(response.status).toBe(404);
  });

  it('should not be able to get data of a non-existing statement operation', async () => {
    const name = 'Jane Doe';
    const email = 'janedoe@email.com';
    const password = 'janedoepass';

    await request(app)
      .post('/api/v1/users')
      .send({
        name,
        email,
        password,
      });

    const { body } = await request(app)
      .post('/api/v1/sessions')
      .send({
        email,
        password,
      });

    const nonExistingStatementId = generateUuid();

    const response = await request(app)
      .get(`/api/v1/statements/${nonExistingStatementId}`)
      .set({ Authorization: `Bearer ${body.token}` })
      .send();

    expect(response.status).toBe(404);
  });

  it('should be able to get data of an statement operation of a user', async () => {
    const name = 'Jane Doe';
    const email = 'janedoe@email.com';
    const password = 'janedoepass';

    await request(app)
      .post('/api/v1/users')
      .send({
        name,
        email,
        password,
      });

    const { body } = await request(app)
      .post('/api/v1/sessions')
      .send({
        email,
        password,
      });

    const amount = '100.00';
    const description = 'Job';

    const { body: { id } } = await request(app)
      .post('/api/v1/statements/deposit')
      .set({ Authorization: `Bearer ${body.token}` })
      .send({
        amount,
        description,
      });

    const response = await request(app)
      .get(`/api/v1/statements/${id}`)
      .set({ Authorization: `Bearer ${body.token}` })
      .send();

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', id);
    expect(response.body).toHaveProperty('amount', amount);
    expect(response.body).toHaveProperty('description', description);
    expect(response.body).toHaveProperty('type', 'deposit');
    expect(response.body).toHaveProperty('created_at');
  });
});
