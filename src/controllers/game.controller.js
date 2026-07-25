import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { STATIC_FILE_CONTENT_TYPES } from '../constants/static-files.constant.js';

const gameDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../public/quake-like');
const indexFileName = 'index.html';
const notFoundStatusCode = 404;
const forbiddenStatusCode = 403;
const allowedMethods = new Set(['GET', 'HEAD']);

/**
 * Serves the local arena shooter prototype.
 *
 * @param {{
 *   method: string,
 *   path: string,
 *   status?: number,
 *   type?: string,
 *   body?: Buffer | string,
 *   redirect: (url: string) => void,
 * }} ctx
 * @param {Function} next
 * @returns {Promise<void>}
 */
export async function GameController(ctx, next) {
  if (!isGameRequest({ requestPath: ctx.path })) {
    return next();
  }
  if (!allowedMethods.has(ctx.method)) {
    ctx.status = notFoundStatusCode;
    return;
  }
  if (ctx.path === '/') {
    ctx.redirect('/game/');
    return;
  }
  if (ctx.path === '/game') {
    ctx.redirect('/game/');
    return;
  }
  const filePath = resolveGameFilePath({ requestPath: ctx.path });
  if (!filePath) {
    ctx.status = forbiddenStatusCode;
    return;
  }
  await serveGameFile({ ctx, filePath });
}

/**
 * @param {{ requestPath: string }} params
 * @returns {boolean}
 */
function isGameRequest({ requestPath }) {
  return requestPath === '/' || requestPath === '/game' || requestPath.startsWith('/game/');
}

/**
 * @param {{ requestPath: string }} params
 * @returns {string | null}
 */
function resolveGameFilePath({ requestPath }) {
  const relativePath = requestPath.replace(/^\/game\/?/, '') || indexFileName;
  const filePath = path.resolve(gameDirectory, relativePath);
  if (!filePath.startsWith(`${gameDirectory}${path.sep}`) && filePath !== path.join(gameDirectory, indexFileName)) {
    return null;
  }
  return filePath;
}

/**
 * @param {{ ctx: { status?: number, type?: string, body?: Buffer | string }, filePath: string }} params
 * @returns {Promise<void>}
 */
async function serveGameFile({ ctx, filePath }) {
  try {
    ctx.type = STATIC_FILE_CONTENT_TYPES[path.extname(filePath)] || 'application/octet-stream';
    ctx.body = await fs.readFile(filePath);
  } catch (error) {
    ctx.status = notFoundStatusCode;
  }
}
