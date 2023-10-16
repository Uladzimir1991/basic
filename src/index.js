import mysql from 'mysql2/promise';
import Koa, { HttpError } from 'koa';
import bodyParser from 'koa-bodyparser';
import { DatabaseService } from './services/database.service.js';
import { EmailService } from './services/email.service.js';
import { RepositoryService } from './services/repository.service.js';
import { UserService } from './services/user.service.js';
import { PutUsersController } from './controllers/put-users.controller.js';

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  port: Number(process.env.MYSQL_PORT) || 3306,
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'root',
  database: process.env.MYSQL_DATABASE || 'main',
  waitForConnections: true,
  connectionLimit: Number(process.env.MYSQL_CONNECTION_LIMIT) || 100,
  queueLimit: 0,
});

const databaseService = new DatabaseService(pool);
const emailService = new EmailService();
const repositoryService = new RepositoryService({
  databaseService,
});

const app = new Koa();

app.use(bodyParser({
  extendTypes: {
    json: ['application/x-javascript'],
  },
}));
app.use(async (ctx, next) => {
  ctx.userService = new UserService({
    repositoryService,
    emailService,
  });

  return next();
});
app.use(PutUsersController);

export let httpServer;

function startServer(port) {
  httpServer = app.listen(port, () => {
    console.log(`Сервер запущен на порту ${port}`);
  });

  httpServer.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Порт ${port} уже используется. Попробую другой порт.`);
      startServer(process.env.RESERVE_PORT);
    } else {
      console.error('Ошибка при запуске сервера:', err);
      throw new HttpError('500');
    }
  });
}

startServer(process.env.PORT);

httpServer.on('close', async () => {
  await pool.end();
});
