//@ts-check
import * as itemModel from '../model/item.js';
import * as itemImageModel from '../model/itemImages.js';
import * as itemCommentModel from '../model/itemComment.js';
import * as categoryModel from '../model/itemCategory.js';
import * as userModel from '../model/user.js';
import { copyFile, unlink, mkdir, rmdir } from "fs/promises";
import { join, extname } from "path";
import { v4 as uuidv4 } from "uuid";
import { isString } from "util";
import { compareCSRF, generateCSRF, setCSRFCookie } from '../csrf.js';
import Debug from 'debug';

const debug = Debug("rs:ctrl:products");

const csrfTitleCategory = "csrfCategory";
const csrfTitleProduct = "csrfProduct";
const csrfTitleEdit = "csrfEdit";
const csrfTitleComment = "csrfComment";

 /**
  * @type {import('../app.js').Controller}
  */
 export async function showAll(ctx) { 
    debug("showAll");
    await renderProducts(ctx, undefined, undefined);
}

/**
 * @type {import('../app.js').Controller}
 */
export async function show(ctx) {
    debug("show");
    const item = await itemModel.getById(ctx.db, ctx.params.id);
    if(item) {
        await renderDetail(ctx, undefined, undefined);
    } else {
        ctx.status = 404;
    }
}

/**
 * @type {import('../app.js').Controller}
 */
export async function add(ctx) {
    debug("add");
    const formData = ctx.request.body || {};
    const errors = validateItem(formData);
    if(Object.values(errors).some(isString) || !compareCSRF(ctx, csrfTitleProduct, formData.csrf)) {
        //something is wrong
        await renderProducts(ctx, formData, errors);
    } else {
        const itemId = await itemModel.add(ctx.db, formData);
        if (itemId !== undefined) {
            await saveImage(ctx, itemId); //non-export functions are at the bottom of the file
        }
        ctx.session.flash = `Artikel ${formData.title} wurde hinzugefügt.`;
        ctx.redirect("/products");
    }
}

/**
 * @type {import('../app.js').Controller}
 */
export async function showEdit(ctx) {
    debug("showEdit");
    const item = await itemModel.getById(ctx.db, ctx.params.id);
    if(item) {
        await renderEdit(ctx, undefined, undefined);
    } else {
        ctx.status = 404;
    }
}

/**
 * @type {import('../app.js').Controller}
 */
export async function edit(ctx) {
    debug("edit");
    const formData = ctx.request.body || {};
    await saveImage(ctx, ctx.params.id);
    const errors = validateItem(formData);
    if(Object.values(errors).some(isString) || !compareCSRF(ctx, csrfTitleEdit, formData.csrf)) {
        //something is wrong
        await renderEdit(ctx, formData, errors);
    } else {
        await itemModel.update(ctx.db, ctx.params.id, formData);
        ctx.session.flash = `Artikel ${formData.title} wurde aktualisiert.`;
        ctx.redirect(`/products`)
    }
}

/**
 * @type {import('../app.js').Controller}
 */
export async function deleteImage(ctx) {
    debug("deleteImages");
    const image = await itemImageModel.getById(ctx.db, ctx.params.image);
    if(image) {
        const destPath = join("public", "images", "products", ctx.params.id);
        await unlink(join(destPath, image.path));
        await itemImageModel.deleteById(ctx.db, ctx.params.image);
        ctx.status = 204;
        ctx.redirect(`/products/edit/${ctx.params.id}`);
    } else {
        ctx.status = 404;
    }
}

/**
 * @type {import('../app.js').Controller}
 */
export async function confirmDeletion(ctx) {
    debug("confirmDeletion");
    const item = await itemModel.getById(ctx.db, ctx.params.id);
    if(item) {
        await ctx.render("confirmProductDeletion", { product: item });
    } else {
        ctx.status = 404;
    }
}

/**
 * @type {import('../app.js').Controller}
 */
export async function deleteById(ctx) {
    debug("deleteById");
    const item = await itemModel.getById(ctx.db, ctx.params.id);
    if(item) {
        const destPath = join("public", "images", "products", ctx.params.id);
        const images = await itemImageModel.getAllByItem(ctx.db, ctx.params.id);
        for(const image of images) {
            await unlink(join(destPath, image.path));
        }
        await rmdir(destPath);
        await itemModel.deleteById(ctx.db, ctx.params.id);
        ctx.status = 204;
        ctx.session.flash = `Artikel ${item.title} wurde gelöscht.`;
        ctx.redirect("/products");
    } else {
        ctx.status = 404;
    }
}

/**
 * @type {import('../app.js').Controller}
 */
export async function editCategories(ctx) {
    debug("editCategories");
    await renderCategories(ctx, undefined, undefined);
}

/**
 * @type {import('../app.js').Controller}
 */
export async function addCategory(ctx) {
    debug("addCategories");
    const formData = ctx.request.body || {};
    const errors = {
        title: validateTextMin(3, "Titel", formData.title)
    };
    if(Object.values(errors).some(isString) || !compareCSRF(ctx, csrfTitleCategory, formData.csrf)) {
        //something is wrong
        await renderCategories(ctx, formData, errors);
    } else {
        await categoryModel.add(ctx.db, formData);
        ctx.redirect("/products/categories");
    }
}

/**
 * @type {import('../app.js').Controller}
 */
export async function deleteCategory(ctx) {
    debug("deleteCategories");
    if(await categoryModel.getById(ctx.db, ctx.params.id)) {
        await categoryModel.deleteById(ctx.db, ctx.params.id);
        ctx.redirect("/products/categories");
    } else {
        ctx.status = 404;
    }
}

/**
 * @type {import('../app.js').Controller}
 */
export async function addComment(ctx) {
    debug("addComment");
    const formData = ctx.request.body || {};
    const errors = {
        content: validateTextMin(5, "Kommentar", formData.content)
    }
    if(Object.values(errors).some(isString) || !compareCSRF(ctx, csrfTitleComment, formData.csrf)) {
        await renderDetail(ctx, formData, errors);
    } else {
        const comment = {
            ... formData,
            author: ctx.session.user ? ctx.session.user.id : undefined,
            item: ctx.params.id
        };
        await itemCommentModel.add(ctx.db, comment);
        ctx.redirect(`/products/${ctx.params.id}`);
    }
}

/**
 * @type {import('../app.js').Controller}
 */
export async function deleteComment(ctx) {
    debug("deleteComment");
    const comment = await itemCommentModel.getById(ctx.db, ctx.params.comment);
    if(comment) {
        await itemCommentModel.deleteById(ctx.db, ctx.params.comment);
        ctx.redirect(`/products/${ctx.params.id}`);
    } else {
        ctx.status = 404;
    }
}





    /* NON-EXPORT FUNCTIONS */

/**
 * @param {import('../app.js').Controller extends (ctx: infer Ctx, next: any) => any ? Ctx : never} ctx
 * @param {*} formData 
 * @param {*} errors 
 */
async function renderProducts(ctx, formData, errors) {
    debug("renderProducts formData = %o, errors = %o", formData, errors);
    const categories = await categoryModel.getAll(ctx.db);
    /** @type {{ [key: string]: string | undefined }} */
    const { category } = ctx.query;
    const items = category
      ? await itemModel.getAllByCategory(ctx.db, Number.parseInt(category)) 
      : await itemModel.getAll(ctx.db);
    /** @type {import('../model/item.js').Item[]} */
    var formattedItems = [];
    for(const item of items) {
        const preview = await itemModel.getPreview(ctx.db, item.id);
        if(preview){
            const current = {
                ...item,
                preview: join("/", "images", "products", item.id.toString(), preview.path)
            };
            formattedItems.push(current);
        }
    }
    const csrf = await generateCSRF();
    debug("renderProducts csrf = %s", csrf);
    const entry = {
    ...formData,
    csrf
    };
    setCSRFCookie(ctx, csrfTitleProduct, csrf);
    await ctx.render("products", {products: formattedItems, categories: categories, entry: entry, errors: errors});
    // status 200 and content-type are being set automatically
}

/**
 * @param {import('../app.js').Controller extends (ctx: infer Ctx, next: any) => any ? Ctx : never} ctx
 * @param {*} formData
 * @param {*} errors 
 */
async function renderDetail(ctx, formData, errors) {
    debug("renderDetail formData = %o, errors = %o", formData, errors);
    const item = await itemModel.getById(ctx.db, ctx.params.id);
    if(item) {
        const images = await itemImageModel.getAllByItem(ctx.db, item.id);
        images.map(image => image.path = join("/", "images", "products", item.id.toString(), image.path));
        const comments = await itemCommentModel.getAllByItem(ctx.db, item.id);
        var formattedComments = [];// display author if defined
        for(const comment of comments) {
            const user = comment.author 
                ? await userModel.getById(ctx.db, comment.author)
                : undefined;
            const current = {
                ...comment,
                displayAuthor: user
                    ? user.name
                    : undefined,
                displayDate: `${comment.date.getDate()}/${comment.date.getMonth()+1}/${comment.date.getFullYear()} - ${comment.date.getHours()}:${comment.date.getMinutes()}`
            };
            formattedComments.push(current);
        }
        const csrf = await generateCSRF();
        debug("renderDetail csrf = %s", csrf);
        const entry = {
            ...formData,
        csrf
        };
        setCSRFCookie(ctx, csrfTitleComment, csrf);
        await ctx.render("detail", {product: item, images: images, comments: formattedComments, entry: entry, errors: errors});
        // status 200 and content-type are being set automatically
    }
}

/**
 * @param {import('../app.js').Controller extends (ctx: infer Ctx, next: any) => any ? Ctx : never} ctx
 * @param {*} formData 
 * @param {*} errors 
 */
async function renderEdit(ctx, formData, errors) {
    debug("renderEdit formData = %o, errors = %o", formData, errors);
    const item = await itemModel.getById(ctx.db, ctx.params.id);
    if(item) {
        const categories = await categoryModel.getAll(ctx.db);
        const destPath = join("/images", "products", ctx.params.id);
        const preview = await itemModel.getPreview(ctx.db, ctx.params.id);
        if(preview) {
            preview.path = join(destPath, preview.path);
        }
        const images = await itemImageModel.getAllButPreview(ctx.db, ctx.params.id);
        images.map(image => image.path = join(destPath, image.path));
        const content = formData!==undefined 
            ? formData 
            : item;
        const csrf = await generateCSRF();
        debug("renderEdit csrf = %s", csrf);
        const entry = {
            ...content,
        csrf
        };
        setCSRFCookie(ctx, csrfTitleEdit, csrf);
        await ctx.render("editProduct", {product: item, preview: preview, images: images, categories: categories, entry: entry, errors: errors});
    }
}

/**
 * @param {import('../app.js').Controller extends (ctx: infer Ctx, next: any) => any ? Ctx : never} ctx
 * @param {*} formData
 * @param {*} errors 
 */
async function renderCategories(ctx, formData, errors) {
    debug("renderCategories formData = %o, errors = %o", formData, errors);
    const categories = await categoryModel.getAll(ctx.db);
    const csrf = await generateCSRF();
    debug("renderCategories csrf = %s", csrf);
        const entry = {
            ...formData,
        csrf
        };
        setCSRFCookie(ctx, csrfTitleCategory, csrf);
    await ctx.render("categories", { categories: categories, entry: entry, errors: errors });
}

/**
 * @param {*} formData 
 */
function validateItem(formData) {
    debug("validateItem formData = %o", formData);
    return {
        title: validateTextMin(3, "Titel", formData.title),
        price: !/^[\d,]+$/.test(formData.price)
            ? "Preis muss eine Zahl sein."
            : undefined,
        size: !/^[\d\w üöäß]*$/i.test(formData.size)
            ? "Größe darf keine Sonderzeichen enthalten."
            : undefined
    };
}
 
/**
 * @param {number} min 
 * @param {string} fieldName 
 * @param {string} text 
 */
function validateTextMin(min, fieldName, text) {
    debug("validateTextMin min = %d fieldName = %s text = %s", min, fieldName, text);
  return typeof text !== "string"
  ? `${fieldName} sollte ein Text sein.`
  : text.length < min
  ? `${fieldName} sollte mindestens ${min} Zeichen haben, bisher sind es nur ${text.length}.`
  : undefined
}

/**
 * @param {import('../app.js').Controller extends (ctx: infer Ctx, next: any) => any ? Ctx : never} ctx
 * @param {number} itemId
 */
async function saveImage(ctx, itemId) {
    debug("saveImage");
    //get the images that were uploaded by the user
    const previewImage = ctx.request.files?.previewImage;
    const additionalImages = ctx.request.files?.additionalImages;
    //the directory in which the images are saved
    const destPath = join("public", "images", "products", itemId.toString());

    const currentPreview = await itemModel.getPreview(ctx.db, itemId);
    //check if the preview image is defined, singular and an image file format
    if (previewImage !== undefined && !Array.isArray(previewImage) && /^image\/.+/.test(previewImage.type)) {
        if(currentPreview) { //if a preview image exists, the products is being edited, not added
            debug("saveImage replace preview");
            //remove the old picture
            await unlink(join(destPath, currentPreview.path));
            //designation with uuid
            const newPreviewFileName = `${uuidv4()}${extname(previewImage.name)}`;
            //copy the new image into the directory
            await copyFile(previewImage.path, join(destPath, newPreviewFileName));
            //update
            await itemImageModel.update(ctx.db, currentPreview.id, newPreviewFileName);
        } else {
            debug("saveImage new preview");
            //if there's none, the item is new and a directory is needed
            await mkdir(destPath);
            //designation with uuid
            const newPreviewFileName = `${uuidv4()}${extname(previewImage.name)}`;
            //copy the image into the directory
            await copyFile(previewImage.path, join(destPath, newPreviewFileName));
            //add the preview immage to the image table of the database
            const preview = {item: itemId, path: newPreviewFileName};
            const newId = await itemImageModel.add(ctx.db, preview);
            //mark the picture as preview by adding it to the preview image table
            if(newId) {
                await itemModel.addPreview(ctx.db, newId, itemId);
            }
        }
    } else {
        //preview image only needs to be uploaded when it's a new item, existing items should already have one
        if(!currentPreview) {
            const errors = {
                preview: "Vorschaubild muss beigefügt werden."
            };
            await renderProducts(ctx, ctx.request.body, errors);
        }
    }
    //check if there's additional images
    if(additionalImages !== undefined) {
        debug("saveImage additional Images found");
        //convert to an array if there's only one additional image
        const additionalImagesArray = 
            Array.isArray(additionalImages) 
            ? additionalImages 
            : [additionalImages];

        //go through it once for however many pictures were uploaded
        await forEachAsync(additionalImagesArray, async additionalImage => {
            if(/^image\/.+/.test(additionalImage.type)) {
                //designation with uuid
                const newFileName = `${uuidv4()}${extname(additionalImage.name)}`;
                //copy the image into the directory
                await copyFile(additionalImage.path, join(destPath, newFileName));
                 //add the immage to the image table of the database
                const additional = {item:itemId, path:newFileName};
                 await itemImageModel.add(ctx.db, additional);
            }
                
        })
    }
}

/**
 * @template A
 * @param {A[]} arr 
 * @param {(element: A, index: number, array: A[]) => Promise<void>} callback 
 * @returns {Promise<void>}
 */
async function forEachAsync(arr, callback) {
    debug("forEachAsync");
    for (let i = 0; i < arr.length; i++) {
        await callback(arr[i], i, arr)
    }
}