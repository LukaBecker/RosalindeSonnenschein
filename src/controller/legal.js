//@ts-check
import Debug from 'debug';

const debug = Debug("rs:ctrl:legal");

/**
 * @type {import('../app.js').Controller}
 */
export async function renderImprint(ctx) {
    debug("renderImprint");
    await ctx.render("imprint");
}

/**
 * @type {import('../app.js').Controller}
 */
export async function renderPrivacy(ctx) {
    debug("renderPrivacy");
    await ctx.render("privacy");
}