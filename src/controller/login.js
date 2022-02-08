import * as userModel from '../model/user.js';
import argon2 from 'argon2';
import { generateCSRF, setCSRFCookie, compareCSRF } from '../csrf.js';
import Debug from 'debug';

const debug = Debug("rs:ctrl:login");

const csrfTitle = "csrfLogin";

/**
 * @type {import('../app.js').Controller}
 */
export async function showLogin(ctx) {
    debug("showLogin");
    await renderLogin(ctx, undefined, undefined);
}

/**
 * @type {import('../app.js').Controller}
 */
export async function login(ctx) {
    debug("login");
    const formData = ctx.request.body || {};
    const user = await userModel.getByUsername(ctx.db, formData.username.toLowerCase());
    if(user && !user.archived && await argon2.verify(user.password, formData.password) && compareCSRF(ctx, csrfTitle, formData.csrf)) {
        ctx.session.user = user;
        ctx.redirect("/");
    } else {
        console.log(user);
        console.log(formData.password);
        console.log(user?.archived);
        const errors = {
            login: "Benutzername und/oder Passwort stimmen nicht."
        }
        await renderLogin(ctx, formData, errors);
    }
}

/**
 * @type {import('../app.js').Controller}
 */
export function logout(ctx) {
    debug("logout");
    ctx.session.user = undefined;
    ctx.redirect("/");
}

/**
 * @type {import('../app.js').Controller}
 */
export async function isAuth(ctx, next) {
    debug("isAuth");
    if(ctx.session.user) {
        await next();
    } else {
        ctx.throw(401);
    }
}

/**
 * @param {number} role
 * @return {import('../app.js').Controller}
 */
export function isAuthRole(role) {
    debug("isAuthRole role = %d", role);
    return async (ctx, next) => {
        if(ctx.session.user && ctx.session.user.role<=role) {
            await next();
        } else {
            ctx.throw(401);
        }
    }
}

/**
 * @type {import('../app.js').Controller} 
 */
export async function provideAuth(ctx, next) {
    debug("provideAuth");
    ctx.state.user = ctx.session.user;
    ctx.state.isAuth = ctx.session.user !== undefined;
    ctx.state.isAdmin = ctx.session.user ? ctx.session.user.role <= 1 : undefined;
    ctx.state.isModerator = ctx.session.user ? ctx.session.user.role <=2 : undefined;
    ctx.state.isPublisher = ctx.session.user ? ctx.session.user.role <=3 : undefined;
    await next();
}

/**
 * @type {import('../app.js').Controller} 
 */
export async function provideFlash(ctx, next) {
    debug("provideFlash");
    ctx.state.flash = ctx.session.flash;
    ctx.session.flash = undefined;
    await next();
}

/**
 * @param {import('../app.js').Controller extends (ctx: infer Ctx, next: any) => any ? Ctx : never} ctx
 * @param {*} formData 
 * @param {*} errors 
 */
async function renderLogin(ctx, formData, errors) {
    debug("renderLogin formData = %o, errors = %o", formData, errors);
    const csrf = await generateCSRF();
    debug("renderLogin csrf = %s", csrf);
    const entry = {
    ...formData,
    csrf
    };
    setCSRFCookie(ctx, csrfTitle, csrf);
    await ctx.render("login", { entry: entry, errors: errors });
}