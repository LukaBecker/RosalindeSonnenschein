//@ts-check
import SQL from "sql-template-strings";
import Debug from 'debug';

const debug = Debug("rs:model:itemComment");

/**
 * A comment as saved in the database
 * @typedef RawItemComment
 * @property {number} id
 * @property {number} author
 * @property {number} item
 * @property {string} content
 * @property {string} date
 */

/**
 * A comment resolved to continue working with
 * @typedef ItemComment
 * @property {number} id
 * @property {number} author
 * @property {number} item
 * @property {string} content
 * @property {Date} date
 */





/**
 * Returns all comments from one item.
 *
 * @param {import("sqlite").Database} db
 * @param {number} item
 * @returns {Promise<ItemComment[]>}
 */
export async function getAllByItem(db, item) {
    debug("getAllByItem item = %d", item);
    /** @type {RawItemComment[]} */
    const rawComments = await db.all(SQL`SELECT * FROM Item_Comment WHERE item=${item} ORDER BY date DESC`);
    return rawComments.map(rawComment => ({
        ...rawComment, 
        date: new Date(rawComment.date)
    }));
}





/**
 * Returns all comments from one author.
 *
 * @param {import("sqlite").Database} db
 * @param {number} author
 * @returns {Promise<ItemComment[]>}
 */
export async function getAllByAuthor(db, author) {
    debug("getAllByAuthor author = %d", author);
    /** @type {RawItemComment[]} */
    const rawComments = await db.all(SQL`SELECT * FROM Item_Comment WHERE author=${author}`);
    return rawComments.map(rawComment => ({
        ...rawComment, 
        date: new Date(rawComment.date)
    }));
}





/**
 * Returns one comment with a specific id.
 *
 * @param {import("sqlite").Database} db
 * @param {number} id
 * @returns {Promise<ItemComment | undefined>}
 */
export async function getById(db, id) {
    debug("getById id = %d", id);
    /** @type {RawItemComment | undefined} */
    const rawComment = await db.get(SQL`SELECT * FROM Item_Comment WHERE id=${id}`);
    return rawComment ? {
        ...rawComment,
        date: new Date(rawComment.date)
    } : undefined;
}





/**
 * Adds a new comment to the database.
 *
 * @param {import("sqlite").Database} db
 * @param {Omit<ItemComment, "id" | "date">} comment
 * @returns {Promise<number | undefined>}
 */
export async function add(db, comment) {
    debug("add comment = %o", comment);
    /** @type  {Omit<RawItemComment, "id">}*/
    const rawComment = {
        ...comment, 
        date: new Date().toISOString()
    }
    const result = await db.run(SQL`
    INSERT INTO Item_Comment (author, item, content, date) 
    VALUES (${rawComment.author}, ${rawComment.item}, ${rawComment.content}, ${rawComment.date})
    `);
    return result.lastID;
}





/**
 * Deletes a comment with a specific id from the database.^
 *
 * @param {import("sqlite").Database} db
 * @param {number} id
 * @returns {Promise<number | undefined>}
 */
export async function deleteById(db, id) {
    debug("deleteById id = %d", id);
    const result = await db.run(SQL`DELETE FROM Item_Comment WHERE id=${id}`);
    return result.changes;
}
