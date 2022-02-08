//@ts-check
import SQL from "sql-template-strings";
import * as itemImagesModel from "./itemImages.js";
import Debug from 'debug';

const debug = Debug("rs:model:item");

/**
 * An item as saved in the database
 * @typedef RawItem
 * @property {number} id
 * @property {string} title
 * @property {number} type
 * @property {number} price
 * @property {string} size
 */

/**
 * An item resolved to continue working with
 * @typedef Item
 * @property {number} id
 * @property {string} title
 * @property {number} type
 * @property {number} price
 * @property {string} size
 */





/**
 * Returns all items in an array.
 *
 * @param {import("sqlite").Database} db
 * @returns {Promise<Item[]>}
 */
export async function getAll(db) {
    debug("getAll");
    /** @type {RawItem[]} */
    const rawItems = await db.all(SQL`SELECT * FROM Item ORDER BY id DESC`);
    // no resolving needed since RawItem and Item consist of identical attributes and types
	return rawItems;
}





/**
 * Returns all items of one category.
 *
 * @param {import("sqlite").Database} db
 * @param {number} category
 * @returns {Promise<Item[]>}
 */
export async function getAllByCategory(db, category) {
    debug("getAllByCategory category = %d", category);
    /** @type {RawItem[]} */
    const rawItems = await db.all(SQL`SELECT * FROM Item WHERE type=${category} ORDER BY id DESC`);
    // no resolving needed since RawItem and Item consist of identical attributes and types
    return rawItems;
}





/**
 * Returns one item with a specific id.
 *
 * @param {import("sqlite").Database} db
 * @param {number} id
 * @returns {Promise<Item | undefined>}
 */
export async function getById(db, id) {
    debug("getById id = %d", id);
    /** @type {RawItem | undefined} */
    const rawItem = await db.get(SQL`SELECT * FROM Item WHERE id=${id}`);
    // no resolving needed since RawItem and Item consist of identical attributes and types
    return rawItem;
}





/**
 * Adds a new item to the database.
 *
 * @param {import("sqlite").Database} db
 * @param {Omit<RawItem, "id">} item
 * @returns {Promise<number | undefined>}
 */
export async function add(db, item) {
    debug("add item = %o", item);
    const result = await db.run(SQL`
        INSERT INTO Item (title, type, price, size) 
        VALUES (${item.title}, ${item.type}, ${item.price}, ${item.size})`
        );
    return result.lastID;
}





/**
 * Updates an item in the databse.
 *
 * @param {import("sqlite").Database} db
 * @param {number} id
 * @param {Item} item
 * @return {Promise<number | undefined>}
 */
export async function update(db, id, item) {
    debug("update id = %d item = %o", id, item);
    const result = await db.run(SQL`
        UPDATE Item 
        SET title=${item.title}, type=${item.type}, price=${item.price}, size=${item.size} 
        WHERE id=${id}`
        );
    return result.changes;
  }





/**
 * Deletes an item with a specific id from the database.
 *
 * @param {import("sqlite").Database} db
 * @param {number} id
 * @returns {Promise<number | undefined>}
 */
export async function deleteById(db, id) {
    debug("deleteById id = %d", id);
    const result = await db.run("DELETE FROM Item WHERE id = ?", id);
    return result.changes;
}





/**
 * Returns one item image with a specific id.
 *
 * @param {import("sqlite").Database} db
 * @param {number} item
 * @returns {Promise<import("./itemImages").ItemImage | undefined>}
 */
export async function getPreview(db, item) {
    debug("getPreview item = %d", item);
    /** @type {{ image: number } | undefined } */
    const preview = await db.get(SQL`SELECT image FROM Item_Preview_Image WHERE item=${item}`);
    if(preview) {
        /** @type {import("./itemImages").RawItemImage | undefined} */
        const rawItemPreviewImage = await itemImagesModel.getById(db, preview.image);
        return rawItemPreviewImage;
    }
    return undefined;
}





/**
 * Marks one image as the preview for a specific item.
 * 
 * @param {import("sqlite").Database} db 
 * @param {number} image
 * @param {number} item
 * @returns {Promise<number | undefined>}
 */
export async function addPreview(db, image, item) {
    debug("addPreview image = %d item = %d", image, item);
    const result = await db.run(SQL`
        INSERT INTO Item_Preview_Image (image, item)
        VALUES (${image}, ${item})
    `);
    return result.lastID;
}





/**
 * Updates an item preview image in the database.
 * 
 * @param {import("sqlite").Database} db 
 * @param {number} image
 * @param {number} item
 * @returns {Promise<number | undefined>}
 */
export async function updatePreview(db, image, item) {
    debug("updatePreview image = %d item = %d", image, item);
    const result = await db.run(SQL`
    UPDATE Item_Preview_Image
    SET image=${image}
    WHERE item=${item}
    `);
    return result.changes;
}