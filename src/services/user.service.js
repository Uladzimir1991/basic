import { UserListRepo } from '../repo/user-list.repo.js';

export class UserService {
  /**
     * @param {RepositoryService} repositoryService
     * @param {EmailService} emailService
     */
  constructor({ repositoryService, emailService }) {
    this.repositoryService = repositoryService;
    this.emailService = emailService;
  }

  /**
     *
     * @param {string} nickname
     * @param {string} email
     * @returns {Promise<Object>}
     */

  async add({ nickname, email }) {
    return this.repositoryService.transaction([UserListRepo], async ({ userList }) => {
      let emailId;
      let userId;
      const maxRetries = 3;
      let currentRetry = 0;

      while (currentRetry < maxRetries) {
        try {
          userId = await userList.insert({ nickname });
          emailId = await this.emailService.add({ email });
          break;
        } catch (error) {
          console.error(`Ошибка при добавлении email (попытка ${currentRetry + 1}):`, error);
          currentRetry++;
        }
      }

      if (currentRetry === maxRetries) {
        throw new Error('Превышено количество попыток добавления email');
      }

      return { userId, emailId };
    });
  }
}
