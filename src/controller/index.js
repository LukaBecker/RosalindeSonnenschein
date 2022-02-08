//@ts-check
import * as announcementModel from '../model/announcement.js';
import * as userModel from '../model/user.js';
import { copyFile, unlink, mkdir, rmdir } from "fs/promises";
import { join, extname } from "path";
import { v4 as uuidv4 } from "uuid";
import { isString } from 'util';
import { compareCSRF, generateCSRF, setCSRFCookie } from '../csrf.js';
import Debug from 'debug';

const debug = Debug("rs:ctrl:index");

const csrfTitle = "csrfAnnouncement";

 /**
  * @type {import('../app.js').Controller}
  */
 export async function showAll(ctx) { 
    debug("showAll");
    await renderIndex(ctx, undefined, undefined);
}

/**
 * @type {import('../app.js').Controller}
 */
export async function add(ctx) {
    debug("add");
    const formData = ctx.request.body || {};
    const errors = {
        title: typeof formData.title!=="string" 
            ? "Titel sollte ein Text sein."
            : formData.title.length < 3
            ? `Titel sollte mindestens 3 Zeichen haben, bisher sind es nur ${formData.title.length}.`
            : undefined,
        content: typeof formData.content!=="string"
            ? "Inhalt sollte ein Text sein."
            :formData.content.length<=0
            ? "Inhalt darf nicht leer sein."
            : undefined,
    };
    if(Object.values(errors).some(isString) || !compareCSRF(ctx, csrfTitle, formData.csrf)) {
        await renderIndex(ctx, formData, errors);
    } else {
        const postImage = ctx.request.files?.postImage;
        if (postImage !== undefined && !Array.isArray(postImage) && /^image\/.+/.test(postImage.type)) {
            const fileName = `${uuidv4()}${extname(postImage.name)}`;
            const announcement = { 
                author: ctx.session.user 
                    ? ctx.session.user.id 
                    : undefined,
                title: formData.title,
                content: formData.content,
                image: fileName
            };
            const newId = await announcementModel.add(ctx.db, announcement);
            if(newId) {
                //the directory in which the images are saved
                const destPath = join("public", "images", "posts", newId.toString());
                //create directory
                await mkdir(destPath);
                //copy the image into the directory
                await copyFile(postImage.path, join(destPath, fileName));
            }
        } else {
            const announcement = { 
                author: ctx.session.user ? ctx.session.user.id : undefined,
                title: formData.title,
                content: formData.content,
                image: undefined
            };
            await announcementModel.add(ctx.db, announcement);
        }
        ctx.redirect("/");
    }
}


/**
 * @type {import('../app.js').Controller}
 */
export async function confirmDeletion(ctx) {
    debug("confirmDeletion id = %d", ctx.params.id);
    const announcement = await announcementModel.getById(ctx.db, ctx.params.id);
    if(announcement) {
        await ctx.render("confirmPostDeletion", { post: announcement });
    } else {
        ctx.status = 404;
    }
}

/**
 * @type {import('../app.js').Controller}
 */
export async function deleteById(ctx) {
    debug("deleteById id = %d", ctx.params.id);
    const announcement = await announcementModel.getById(ctx.db, ctx.params.id);
    if(announcement) {
        if(announcement.image) {
            const destPath = join("public", "images", "posts", announcement.id.toString());
            await unlink(join(destPath, announcement.image));
            await rmdir(destPath);
        }
        await announcementModel.deleteById(ctx.db, ctx.params.id);
        ctx.status = 204;
        ctx.redirect("/");
    } else {
        ctx.status = 404;
    }
}

/**
 * @param {import('../app.js').Controller extends (ctx: infer Ctx, next: any) => any ? Ctx : never} ctx
 * @param {*} formData
 * @param {*} errors 
 */
async function renderIndex(ctx, formData, errors) {
    debug("renderIndex formData = %o, errors = %o", formData, errors);
    const announcements = await announcementModel.getAll(ctx.db);
    /** @type {import('../model/announcement.js').Announcement[]} */
    var formattedAnnouncements = [];
    for(const announcement of announcements) {
        const user = announcement.author 
            ? await userModel.getById(ctx.db, announcement.author)
            : undefined;
        const current = {
            ...announcement,
            displayAuthor: user
                ? user.name
                : undefined,
            image: announcement.image 
                ? join("/", "images", "posts", announcement.id.toString(), announcement.image) 
                : undefined,
            displayDate: `${announcement.date.getDate()}/${announcement.date.getMonth()+1}/${announcement.date.getFullYear()} - ${announcement.date.getHours()}:${announcement.date.getMinutes()}`
        };
        formattedAnnouncements.push(current);
    }
    const csrf = await generateCSRF();
    debug("renderIndex csrf = %s", csrf);
    const entry = {
    ...formData,
    csrf
    };
    setCSRFCookie(ctx, csrfTitle, csrf);
    await ctx.render("index", { posts: formattedAnnouncements, entry: entry, errors: errors});
}