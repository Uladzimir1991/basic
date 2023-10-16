/**
 * @param {{
 *   userService: UserService,
 *   method: string,
 *   path: string,
 *   request: {
 *     body: {
 *       users: [{nickname: string, email:string}],
 *     },
 *   },
 * }} ctx
 * @returns {Promise<void>}
 * @constructor
 */
export const PutUsersController = async (ctx) => {
  const { method, path } = ctx;
  const users = ctx.request.body.users;

  if (!/^PUT \/users$/.test(`${method} ${path}`)) {
    return;
  }

  const results = users.map((user) => {
    try {
      return ctx.userService.add(user);
    } catch (error) {
      console.error('Ошибка при добавлении пользователя:', error);
      ctx.status = 400;
      ctx.body = {
        error: 'Ошибка при добавлении пользователя',
      };
    }
  });

  ctx.body = {
    results: await Promise.all(results),
  };
};
