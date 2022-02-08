//@ts-check
import { randomBytes as randomBytesSync} from 'crypto';
import { promisify } from 'util';
import Debug from 'debug';

const debug = Debug("rs:module:csrf");

const randomBytes = promisify(randomBytesSync);

export async function generateCSRF() {
    debug("generateCSRF");
    return (await randomBytes(32)).toString("base64");
}

/**
 * @param {import('./app.js').Controller extends (ctx: infer Ctx, next: any) => any ? Ctx : never} ctx
 * @param {string} title 
 * @param {string} csrf 
 */
export function setCSRFCookie(ctx, title, csrf) {
    debug("setCSRFCookie title = %s csrf = %s", title, csrf);
    ctx.cookies.set(title, csrf, { httpOnly: true, sameSite: "strict", maxAge: 300000 });
}

/**
 * @param {import('./app.js').Controller extends (ctx: infer Ctx, next: any) => any ? Ctx : never} ctx
 * @param {string} title 
 * @param {string} csrf 
 */
export function compareCSRF(ctx, title, csrf) {
    debug("compareCSRF title = %s csrf = %s", title, csrf);
    return (ctx.cookies.get(title) === csrf);
}