//@ts-check
import SQL from "sql-template-strings";
import Debug from 'debug';

const debug = Debug("rs:model:itemCategory");

/**
 * A category as saved in the database
 * @typedef RawItemCategory
 * @property {number} id
 * @property {string} title
 */

/**
 * A category resolved to continue working with
 * @typedef ItemCategory
 * @property {number} id
 * @property {string} title
 */





/**
 * Returns all categories in an array.
 *
 * @param {import("sqlite").Database} db
 * @returns {Promise<ItemCategory[]>}
 */
export async function getAll(db) {
    debug("getAll");
    /** @type {RawItemCategory[]} */
    const rawCategories = await db.all(SQL`SELECT * FROM Item_Category`);
    // no resolving needed since RawItemCategory and ItemCategory consist of identical attributes and types
	return rawCategories;
}





/**
 * Returns one category with a specific id.
 *
 * @param {import("sqlite").Database} db
 * @param {number} id
 * @returns {Promise<ItemCategory>}
 */
export async function getById(db, id) {
    debug("getById id = %d", id);
    const rawCategory = await db.get(SQL`SELECT * FROM Item_Category WHERE id=${id}`);
    // no resolving needed since RawItemCategory and ItemCategory consist of identical attributes and types
    return rawCategory;
}





/**
 * Adds a new category to the database.
 *
 * @param {import("sqlite").Database} db
 * @param {Omit<RawItemCategory, "id">} category
 * @returns {Promise<number | undefined>}
 */
export async function add(db, category) {
    debug("add category = %o", category);
    const result = await db.run(SQL`
        INSERT INTO Item_Category (title) 
        VALUES (${category.title})`
        );
    return result.lastID;
}





/**
 * Deletes a category with a specific id from the database.
 *
 * @param {import("sqlite").Database} db
 * @param {number} id
 * @returns {Promise<number | undefined>}
 */
export async function deleteById(db, id) {
    debug("deleteById id = %d", id);
    const result = await db.run(SQL`DELETE FROM Item_Category WHERE id=${id}`);
    return result.changes;
}
