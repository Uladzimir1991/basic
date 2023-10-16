import { HttpError } from 'koa';

export class DatabaseService {
  /**
     * @param {Pool} pool
     */
  constructor(pool) {
    this.pool = pool;
  }

  /**
     * @returns {Promise<import('mysql2/promise').Connection>}
     */
  async getConnection() {
    try {
      return await this.pool.getConnection();
    } catch (error) {
      console.error('Ошибка при получении соединения с базой данных:', error);
      throw new HttpError('500');
    }
  }

  /**
     * @param { Function } callback
     * @returns {Promise<any>}
     */
  async transaction(callback) {
    const connection = await this.getConnection();
    let result = null;

    await connection.beginTransaction();
    try {
      result = await callback(connection);
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    }

    return result;
  }
}
