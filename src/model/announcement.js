//@ts-check
import SQL from "sql-template-strings";
import Debug from 'debug';

const debug = Debug("rs:model:announcement");

/**
 * An announcement as saved in the database
 * @typedef RawAnnouncement
 * @property {number} id
 * @property {number | undefined} author
 * @property {string} title
 * @property {string} content
 * @property {string | undefined} image
 * @property {string} date
 */

/**
 * An announcement resolved to continue working with
 * @typedef Announcement
 * @property {number} id
 * @property {number | undefined} author
 * @property {string} title
 * @property {string} content
 * @property {string | undefined} image
 * @property {Date} date
 */





 /**
 * Returns all announcements in an array.
 *
 * @param {import("sqlite").Database} db
 * @returns {Promise<Announcement[]>}
 */
export async function getAll(db) {
    debug("getAll");
    /** @type {RawAnnouncement[]} */
    const rawAnnouncements = await db.all("SELECT * FROM Announcement ORDER BY date DESC");
	return rawAnnouncements.map(rawAnnouncement => ({
        ...rawAnnouncement, 
        date: new Date(rawAnnouncement.date)
    }));
}





 /**
 * Returns all announcements by one user in an array.
 *
 * @param {import("sqlite").Database} db
 * @param {number} author
 * @returns {Promise<Announcement[]>}
 */
export async function getAllByAuthor(db, author) {
    debug("getAllByAuthor author = %d", author);
    /** @type {RawAnnouncement[]} */
    const rawAnnouncements = await db.all(SQL`SELECT * FROM Announcement WHERE author=${author}`);
	return rawAnnouncements.map(rawAnnouncement => ({
        ...rawAnnouncement, 
        date: new Date(rawAnnouncement.date)
    }));
}

 




 /**
 * Returns one announcement with a specific id.
 *
 * @param {import("sqlite").Database} db
 * @param {number} id
 * @returns {Promise<Announcement | undefined>}
 */
export async function getById(db, id) {
    debug("getById id = %d", id);
    /** @type {RawAnnouncement | undefined} */
    const rawAnnouncement = await db.get(SQL`SELECT * FROM Announcement WHERE id=${id}`);
    return rawAnnouncement ? {
        ...rawAnnouncement,
        date: new Date(rawAnnouncement.date)
    } : undefined;
}





/**
 * Adds a new announcement piece to the database.
 *
 * @param {import("sqlite").Database} db
 * @param {Omit<RawAnnouncement, "id" | "date">} announcement
 * @returns {Promise<number | undefined>}
 */
export async function add(db, announcement) {
    debug("add announcement = %o", announcement);
    /** @type {Omit<RawAnnouncement, "id">} */
    const raw = {
        ...announcement,
        date: new Date().toISOString()
    }
    const result = await db.run(SQL`
        INSERT INTO Announcement (author, title, content, image, date) 
        VALUES (${raw.author}, ${raw.title}, ${raw.content}, ${raw.image}, ${raw.date})
        `);
    return result.lastID;
}





/**
 * Deletes a announcement with a specific id from the database.
 *
 * @param {import("sqlite").Database} db
 * @param {number} id
 * @returns {Promise<number | undefined>}
 */
export async function deleteById(db, id) {
    debug("deleteById id = %d", id);
    const result = await db.run(SQL`DELETE FROM Announcement WHERE id=${id}`);
    return result.changes;
}