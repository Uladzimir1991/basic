// имитируем работу стороннего микросервиса
export class EmailService {
  /**
     * @param { string } email
     * @returns {Promise<number>}
     */
  async add({ email }) {
    return new Promise(
      (resolve) =>
        setTimeout(() => resolve(1), 1000),
    );
  };
}
