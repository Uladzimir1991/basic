import { HttpError } from 'koa';

export class RepositoryService {
  /**
     * @param { DatabaseService } databaseService
     */
  constructor({ databaseService }) {
    this.databaseService = databaseService;
    this.cachedConnection = null;
  }

  /**
     * @param { import('mysql2/promise').Connection } connection
     * @returns {Promise<import('mysql2/promise').Connection>}
     */
  async getConnection(connection) {
    try {
      return connection || this.databaseService.getConnection();
    } catch (error) {
      console.error('Ошибка при получении соединения:', error);
      throw new HttpError('500');
    }
  }

  /**
     * @param {[any]} Repositories
     * @param { import('mysql2/promise').Connection } connection
     * @returns {Promise<{ userList?: UserListRepo }>}
     */
  async create(Repositories) {
    try {
      if (!this.cachedConnection) {
        this.cachedConnection = await this.getConnection();
      }

      return Repositories.reduce((repositories, Repository) => ({
        ...repositories,
        [Repository.name]: new Repository({
          db: this.cachedConnection,
          table: Repository.table,
        }),
      }), {});
    } catch (error) {
      console.error('Ошибка при создании репозиториев:', error);
      throw new HttpError('500');
    }
  }

  /**
     * @param { [BaseRepo] } Repositories
     * @param { function({ userList?: UserListRepo }) } callback
     * @returns {Promise<Object>}
     */
  async transaction(Repositories, callback) {
    try {
      return this.databaseService.transaction(async (connection) => {
        const repositories = await this.create(Repositories, connection);
        return await callback(repositories);
      });
    } catch (error) {
      console.error('Ошибка во время выполнения транзакции:', error);
      throw new HttpError('500');
    }
  }
}
