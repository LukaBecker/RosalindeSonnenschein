//@ts-check
import Debug from 'debug';

const debug = Debug("rs:ctrl:about");

/**
 * @type {import('../app.js').Controller}
 */
export async function renderAbout(ctx) {
    debug("renderAbout");
    await ctx.render("about");
}