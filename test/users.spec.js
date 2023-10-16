import request from 'supertest';
import { httpServer } from '../src/index.js';

afterAll(async () => {
  await httpServer.close();
});

// Интеграционные тесты
describe('Routes', () => {
  describe('PUT /users', () => {
    const test = {};

    beforeAll(async () => {
      test.response = await request(httpServer)
        .put('/users')
        .send({
          users: [{
            nickname: 'SomeUser1',
            email: 'SomeUser1@email.com',
          }, {
            nickname: 'SomeUser2',
            email: 'SomeUser2@email.com',
          }],
        });
    });

    it('should return status equal 200', () => {
      expect(test.response.status).toEqual(200);
    });
  });
});
