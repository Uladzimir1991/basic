import { BaseListRepo } from './base-list.repo.js';
import { HttpError } from 'koa';

export class UserListRepo extends BaseListRepo {
  static name = 'userList';
  static table = 'users';

  /**
     * @param {{nickname: string}} user
     * @returns {Promise<number>}
     */
  async insert(user) {
    try {
      const [{ insertId: userId }] = await super.insert(user);
      return userId;
    } catch (error) {
      console.error('Ошибка при вставке пользователя:', error);
      throw new HttpError('500');
    }
  }
}
