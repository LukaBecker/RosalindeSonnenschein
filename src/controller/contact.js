//@ts-check
import Debug from 'debug';

const debug = Debug("rs:ctrl:contact");

/**
 * @type {import('../app.js').Controller}
 */
export async function renderContact(ctx) {
    debug("renderContact");
    await ctx.render("contact");
}