import { BaseRepo } from './base.repo.js';

export class BaseListRepo extends BaseRepo {
  /**
     * @param {Object} entity
     * @returns {
     *   Promise<[
     *       import('mysql2/promise').ResultSetHeader
     *   ]>
     * }
     */
  async insert(entity) {
    return /** @type Promise<[import('mysql2/promise').ResultSetHeader]> */ this.db.query(
      'INSERT INTO users (nickname) VALUES( ? )', [entity.nickname],
    );
  }
}
