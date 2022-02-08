//@ts-check
import SQL from "sql-template-strings";
import Debug from 'debug';

const debug = Debug("rs:model:itemImages");

/**
 * An image as saved in the database
 * @typedef RawItemImage
 * @property {number} id
 * @property {number} item
 * @property {string} path
 */

/**
 * An image resolved to continue working with.
 * @typedef ItemImage
 * @property {number} id
 * @property {number} item
 * @property {string} path
 */





/**
 * Returns all items in an array.
 *
 * @param {import("sqlite").Database} db
 * @param {number} item
 * @returns {Promise<ItemImage[]>}
 */
export async function getAllByItem(db, item) {
    debug("getAllByItem item = %d", item);
    /** @type {RawItemImage[]} */
    const rawItems = await db.all(SQL`SELECT * FROM Item_Image WHERE item=${item}`);
    // no resolving needed since RawItem and Item consist of identical attributes and types
	return rawItems;
}





/**
 * Returns all items in an array.
 *
 * @param {import("sqlite").Database} db
 * @param {number} item
 * @returns {Promise<ItemImage[]>}
 */
export async function getAllButPreview(db, item) {
    debug("getAllButPreview item = %d", item);
    /** @type {RawItemImage[]} */
    const rawItems = await db.all(SQL`
        SELECT id, Item_Image.item, path
        FROM Item_Image NATURAL JOIN Item_Preview_Image 
        WHERE item=${item} 
        AND Item_Image.id!=Item_Preview_Image.image
        `);
    // no resolving needed since RawItem and Item consist of identical attributes and types
	return rawItems;
}





/**
 * Returns one item image with a specific id.
 *
 * @param {import("sqlite").Database} db
 * @param {number} id
 * @returns {Promise<ItemImage | undefined>}
 */
export async function getById(db, id) {
    debug("getById id = %d", id);
    /** @type {RawItemImage | undefined} */
    const rawItemImage = await db.get(SQL`SELECT * FROM Item_Image WHERE id=${id}`);
    // no resolving needed since RawItem and Item consist of identical attributes and types
    return rawItemImage;
}





/**
 * Adds a new item image to the database.
 * 
 * @param {import("sqlite").Database} db
 * @param {Omit<ItemImage, "id">} image
 * @returns {Promise<number | undefined>}
 */
export async function add(db, image) {
    debug("add image = %o", image);
    const result = await db.run(SQL`
        INSERT INTO Item_Image (item, path) 
        VALUES (${image.item}, ${image.path})
        `);
    return result.lastID;
}





/**
 * Updates an image in the databse.
 * 
 * @param {import("sqlite").Database} db 
 * @param {number} id
 * @param {string} path
 */
export async function update(db, id, path) {
    debug("update id = %d path = %s", id, path);
    const result = await db.run(SQL`
        UPDATE Item_Image 
        SET path=${path}
        WHERE id=${id}`
        );
    return result.changes;
}





/**
 * Deletes all images of one item from the database.
 *
 * @param {import("sqlite").Database} db
 * @param {number} item
 * @returns {Promise<number | undefined>}
 */
export async function deleteAllByItem(db, item) {
    debug("deleteAllByItem item = %d", item);
    const result = await db.run("DELETE FROM Item_Image WHERE id = ?", item);
    return result.changes;
}





/**
 * Deletes an item image with a specific id from the database.
 *
 * @param {import("sqlite").Database} db
 * @param {number} id
 * @returns {Promise<number | undefined>}
 */
export async function deleteById(db, id) {
    debug("deleteById id = %d", id);
    const result = await db.run("DELETE FROM Item_Image WHERE id = ?", id);
    return result.changes;
}