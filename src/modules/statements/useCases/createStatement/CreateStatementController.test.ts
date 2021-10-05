import { v4 as generateUuid } from 'uuid';
import { sign } from 'jsonwebtoken';
import request from 'supertest';
import { Connection } from 'typeorm';

import { app } from '../../../../app';
import createConnection from '../../../../database';
import authConfig from '../../../../config/auth';

let connection: Connection;

describe('CreateStatementController', () => {
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

  it('should not be able to create a new deposit statement for a non-existing user', async () => {
    const { secret, expiresIn } = authConfig.jwt;

    const accessToken = sign({ }, secret, {
      subject: generateUuid(),
      expiresIn,
    });

    const response = await request(app)
      .post('/api/v1/statements/deposit')
      .set({ Authorization: `Bearer ${accessToken}` })
      .send({
        amount: 1000,
        description: 'Salary',
      });

      expect(response.status).toBe(404);
  });

  it('should be able to create a new deposit statement for a user', async () => {
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

    const response = await request(app)
      .post('/api/v1/statements/deposit')
      .set({ Authorization: `Bearer ${body.token}` })
      .send({
        amount: 900.00,
        description: 'Salary',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response).toHaveProperty('body.amount', 900.00);
    expect(response).toHaveProperty('body.description', 'Salary');
    expect(response).toHaveProperty('body.type', 'deposit');
    expect(response.body).toHaveProperty('created_at');
  });

  it('should not be able to create a new withdraw statement for a non-existing user', async () => {
    const { secret, expiresIn } = authConfig.jwt;

    const accessToken = sign({ }, secret, {
      subject: generateUuid(),
      expiresIn,
    });

    const response = await request(app)
      .post('/api/v1/statements/withdraw')
      .set({ Authorization: `Bearer ${accessToken}` })
      .send({
        amount: 500,
        description: 'Market',
      });

    expect(response.status).toBe(404);
  });

  it('should not be able to create a new withdraw statement with insuficient found', async () => {
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

    const response = await request(app)
      .post('/api/v1/statements/withdraw')
      .set({ Authorization: `Bearer ${body.token}` })
      .send({
        amount: 50.00,
        description: 'Market',
      });

    expect(response.status).toBe(400);
  })

  it('should be able to create a new withdraw statement for a user', async () => {
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

    await request(app)
      .post('/api/v1/statements/deposit')
      .set({ Authorization: `Bearer ${body.token}` })
      .send({
        amount: 900.00,
        description: 'Salary',
      });

    const response = await request(app)
      .post('/api/v1/statements/withdraw')
      .set({ Authorization: `Bearer ${body.token}` })
      .send({
        amount: 85.00,
        description: 'Market',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response).toHaveProperty('body.amount', 85.00);
    expect(response).toHaveProperty('body.description', 'Market');
    expect(response).toHaveProperty('body.type', 'withdraw');
    expect(response.body).toHaveProperty('created_at');
  });
});
