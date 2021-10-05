import request from 'supertest';
import { Connection } from 'typeorm';
import { sign } from 'jsonwebtoken';
import { v4 as generateUuid } from 'uuid';

import { app } from '../../../../app';
import createConnection from '../../../../database';
import authConfig from '../../../../config/auth';

let connection: Connection;

describe('GetBalanceController', () => {
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

  it('should not be able to get statements balance of a non-existing user', async () => {
    const { secret, expiresIn } = authConfig.jwt;

    const accessToken = sign({ }, secret, {
      subject: generateUuid(),
      expiresIn,
    });

    const response = await request(app)
      .get('/api/v1/statements/balance')
      .set({ Authorization: `Bearer ${accessToken}` })
      .send();

    expect(response.status).toBe(404);
  });

  it('should be able to get users statements balance', async () => {
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

    const depositAmount = 900.00;

    await request(app)
      .post('/api/v1/statements/deposit')
      .set({ Authorization: `Bearer ${body.token}` })
      .send({
        amount: depositAmount,
        description: 'Salary',
      });

    const withdrawAmount = 85.00;

    await request(app)
      .post('/api/v1/statements/withdraw')
      .set({ Authorization: `Bearer ${body.token}` })
      .send({
        amount: withdrawAmount,
        description: 'Market',
      });

    const response = await request(app)
      .get('/api/v1/statements/balance')
      .set({ Authorization: `Bearer ${body.token}` })
      .send();

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('balance', depositAmount - withdrawAmount);
    expect(response.body).toHaveProperty('statement.length', 2);
  });
});
