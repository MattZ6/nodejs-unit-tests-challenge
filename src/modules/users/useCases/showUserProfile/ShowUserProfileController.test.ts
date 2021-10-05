import { v4 as generateUuid } from 'uuid';
import { sign } from 'jsonwebtoken';
import request from 'supertest';
import { Connection } from 'typeorm';

import { app } from '../../../../app';
import createConnection from '../../../../database';
import authConfig from '../../../../config/auth';

let connection: Connection;

describe('ShowUserProfileController', () => {
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

  it('should not be able to get profile data of unauthenticated user', async () => {
    const response = await request(app)
      .get('/api/v1/profile')
      .send();

    expect(response.status).toBe(401);
  });

  it('should not be able to get profile data of user authenticated with invalid token', async () => {
    const response = await request(app)
      .get('/api/v1/profile')
      .set({ Authorization: 'invalid-token' })
      .send();

    expect(response.status).toBe(401);
  });

  it('should not be able to get profile data of a non-existing user', async () => {
    const { secret, expiresIn } = authConfig.jwt;

    const accessToken = sign({ }, secret, {
      subject: generateUuid(),
      expiresIn,
    });

    const response = await request(app)
      .get('/api/v1/profile')
      .set({ Authorization: `Bearer ${accessToken}` })
      .send();

    expect(response.status).toBe(404);
  });

  it('should be able to get profile data of a authenticated user', async () => {
    const name = 'Jane Doe';
    const email = 'janedoe@email.com';
    const password = 'janedoepass';

    /**
     * OBS: Não curti muito isso de comunicar com vários pontos da aplicação...
     * Da pra dar uma estudada pra verificar se é isso mesmo
     */

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
      .get('/api/v1/profile')
      .set({ Authorization: `Bearer ${body.token}` })
      .send();

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('name', name);
    expect(response.body).toHaveProperty('email', email);
    expect(response.body).toHaveProperty('created_at');
    expect(response.body).toHaveProperty('updated_at');
  });
});
