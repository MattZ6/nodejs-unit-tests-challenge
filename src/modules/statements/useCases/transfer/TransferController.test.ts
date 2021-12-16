import { v4 as generateUuid } from 'uuid';
import { sign } from 'jsonwebtoken';
import request from 'supertest';
import { Connection } from 'typeorm';

import { app } from '../../../../app';
import createConnection from '../../../../database';
import authConfig from '../../../../config/auth';

let connection: Connection;

describe('TransferController', () => {
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

  it('should not be able to transfer from a non-existing user', async () => {
    const { secret, expiresIn } = authConfig.jwt;

    const accessToken = sign({ }, secret, {
      subject: generateUuid(),
      expiresIn,
    });

    const response = await request(app)
      .post(`/api/v1/statements/transfers/${generateUuid()}`)
      .set({ Authorization: `Bearer ${accessToken}` })
      .send({
        amount: 500,
        description: 'any-description',
      });

      expect(response.status).toBe(404);
  });

  it('should not be able to transfer to a non-existing user', async () => {
    const name = 'John Doe';
    const email = 'johndoe@email.com';
    const password = 'johndoepass';

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
      .post(`/api/v1/statements/deposit/${generateUuid()}`)
      .set({ Authorization: `Bearer ${body.token}` })
      .send({
        amount: 500,
        description: 'any-description',
      });

      expect(response.status).toBe(404);
  });

  it('should not be able to transfer with insuficient found', async () => {
    await request(app)
      .post('/api/v1/users')
      .send({
        name: 'Jane Doe',
        email: 'janedoe@email.com',
        password: 'janedoepass',
      });

    const janeDoeLogin = await request(app)
      .post('/api/v1/sessions')
      .send({
        email: 'janedoe@email.com',
        password: 'janedoepass',
      });

      await request(app)
      .post('/api/v1/users')
      .send({
        name: 'John Doe',
        email: 'johndoe@email.com',
        password: 'johndoepass',
      });

    const johnDoeLogin = await request(app)
      .post('/api/v1/sessions')
      .send({
        email: 'johndoe@email.com',
        password: 'johndoepass',
      });

    const response = await request(app)
      .post(`/api/v1/statements/transfers/${janeDoeLogin.body.user.id}`)
      .set({ Authorization: `Bearer ${johnDoeLogin.body.token}` })
      .send({
        amount: 500,
        description: 'any-description',
      });

    expect(response.status).toBe(400);
  });

  it('should be able to transfer', async () => {
    await request(app)
      .post('/api/v1/users')
      .send({
        name: 'Jane Doe',
        email: 'janedoe@email.com',
        password: 'janedoepass',
      });

    const janeDoeLogin = await request(app)
      .post('/api/v1/sessions')
      .send({
        email: 'janedoe@email.com',
        password: 'janedoepass',
      });

      await request(app)
      .post('/api/v1/users')
      .send({
        name: 'John Doe',
        email: 'johndoe@email.com',
        password: 'johndoepass',
      });

    const johnDoeLogin = await request(app)
      .post('/api/v1/sessions')
      .send({
        email: 'johndoe@email.com',
        password: 'johndoepass',
      });

    await request(app)
      .post('/api/v1/statements/deposit')
      .set({ Authorization: `Bearer ${johnDoeLogin.body.token}` })
      .send({
        amount: 500,
        description: 'any-description',
      });

    const response = await request(app)
      .post(`/api/v1/statements/transfers/${janeDoeLogin.body.user.id}`)
      .set({ Authorization: `Bearer ${johnDoeLogin.body.token}` })
      .send({
        amount: 500,
        description: 'any-description',
      });

    expect(response.status).toBe(201);
  });

});
