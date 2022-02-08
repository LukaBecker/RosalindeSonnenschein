import * as userModel from '../model/user.js';
import * as roleModel from '../model/role.js';
import * as announcementModel from '../model/announcement.js';
import * as itemCommentModel from '../model/itemComment.js';
import argon2 from 'argon2';
import { isString } from 'util';
import { compareCSRF, generateCSRF, setCSRFCookie } from '../csrf.js';
import Debug from 'debug';

const debug = Debug("rs:ctrl:users");

const csrfTitle = "csrfAnnouncement";

/**
 * @type {import('../app.js').Controller}
 */
export async function editUsers(ctx) {
    debug("editUsers");
    await renderUsers(ctx, undefined, undefined);
}

/**
 * @type {import('../app.js').Controller}
 */
export async function addUser(ctx) {
    debug("addUser");
    const formData = ctx.request.body || {};
    const errors = {
        name: typeof formData.name !== "string"
            ? `Name sollte ein Text sein.`
            : formData.name.length < 1
            ? `Name sollte mindestens 1 Zeichen haben, bisher sind es nur ${formData.name.length}.`
            : !/^[\d\w üöäß-]+$/i.test(formData.name)
            ? "Name darf keine Sonderzeichen enthalten."
            : undefined,
        username: await userModel.getByUsername(ctx.db, formData.username) 
            ? "Nutzname ist schon vergeben."
            : undefined,
        password: formData.password.length < 8
            ? `Passwort sollte mindestens 8 Zeichen haben, bisher sind es nur ${formData.password.length}.`
            : formData.password !== formData.passwordRepeat
            ? "Passwörter stimmen nicht überein."
            : undefined
    };
    if(Object.values(errors).some(isString) || !compareCSRF(ctx, csrfTitle, formData.csrf)) {
        await renderUsers(ctx, formData, errors);
    } else {
        try {
            const hash = await argon2.hash(formData.password);
            const data = {
                ...ctx.request.body,
                password: hash
            };
            await userModel.add(ctx.db, data);
        } catch (err) {
            ctx.status = 500;
        }
        ctx.redirect("/users");
    }
}

/**
 * @type {import('../app.js').Controller}
 */
export async function confirmDeletion(ctx) {
    debug("confirmDeletion");
    const user = await userModel.getById(ctx.db, ctx.params.id);
    if(user) { //does the user exist?
        if(user.id!==ctx.session.user?.id) { //is a user trying to delete themselves?
            await ctx.render("confirmUserDeletion", { user: user });
        } else {
            ctx.status = 401;
        }
    } else {
        ctx.status = 404;
    }
}

/**
 * @type {import('../app.js').Controller}
 */
export async function deleteUser(ctx) {
    debug("deleteUser");
    const user = await userModel.getById(ctx.db, ctx.params.id);
    if(user) { //does the user exist?
        if(user.id!==ctx.session.user?.id) { //is a user trying to delete themselves?
            const announcements = await announcementModel.getAllByAuthor(ctx.db, user.id);
            const comments = await itemCommentModel.getAllByAuthor(ctx.db, user.id);
            if(announcements.length>0 || comments.length>0) {
                await userModel.setArchived(ctx.db, user.id);
            } else {
                await userModel.deleteById(ctx.db, user.id);
            }
            ctx.redirect("/users");
        } else {
            ctx.status = 401;
        }
    } else {
        ctx.status = 404;
    }
}

/**
 * @param {import('../app.js').Controller extends (ctx: infer Ctx, next: any) => any ? Ctx : never} ctx
 * @param {*} formData
 * @param {*} errors 
 */
async function renderUsers(ctx, formData, errors) {
    debug("renderUsers formData = %o, errors = %o", formData, errors);
    const users = await userModel.getAllNotArchived(ctx.db);
    /** @type {import('../model/user.js').User[]} */
    var formattedUsers = [];
    for(const user of users) {
        const role = await roleModel.getById(ctx.db, user.role);
        const current = {
            ...user,
            displayRole: role
                ? role.title
                : undefined
        };
        formattedUsers.push(current);
    }
    const roles = await roleModel.getAll(ctx.db);
    const csrf = await generateCSRF();
    debug("renderIndex csrf = %s", csrf);
    const entry = {
    ...formData,
    csrf
    };
    setCSRFCookie(ctx, csrfTitle, csrf);
    await ctx.render("users", { users: formattedUsers, roles: roles, entry: entry, errors: errors });
}