export class BaseRepo {
  constructor({ db, table }) {
    this.db = db;
    this.table = table;
  }
}
