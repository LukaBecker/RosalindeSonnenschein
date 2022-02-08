//@ts-check
import Debug from 'debug';

const debug = Debug("rs:ctrl:documentation");

/**
 * @type {import('../app.js').Controller}
 */
export async function renderTimeline(ctx) {
    debug("renderTimeline");
    await ctx.render("timeline");
}

/**
 * @type {import('../app.js').Controller}
 */
export async function renderWWW(ctx) {
    debug("renderWWW");
    await ctx.render("documentationWWW");
}

/**
 * @type {import('../app.js').Controller}
 */
export async function renderFrontend(ctx) {
    debug("renderFrontend");
    await ctx.render("documentationFrontend");
}

/**
 * @type {import('../app.js').Controller}
 */
export async function renderModules(ctx) {
    debug("renderModules");
    await ctx.render("modules");
}

/**
 * @type {import('../app.js').Controller}
 */
export async function renderColours(ctx) {
    debug("renderColours");
    await ctx.render("colours");
}