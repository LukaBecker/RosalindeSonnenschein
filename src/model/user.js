//@ts-check
import SQL from "sql-template-strings";
import Debug from 'debug';

const debug = Debug("rs:model:user");

/**
 * A user as saved in the database
 * @typedef RawUser
 * @property {number} id
 * @property {string} name
 * @property {string} username
 * @property {string} password
 * @property {number} role
 * @property {number} archived
 */

/**
 * A user resolved to continue working with
 * @typedef User
 * @property {number} id
 * @property {string} name
 * @property {string} username
 * @property {string} password
 * @property {number} role
 * @property {number} archived
 */

 




 /**
 * Returns all userss in an array.
 *
 * @param {import("sqlite").Database} db
 * @returns {Promise<User[]>}
 */
export async function getAllNotArchived(db) {
    debug("getAllNotArchived");
    /** @type {RawUser[]} */
    const rawUsers = await db.all("SELECT * FROM User WHERE archived=0");
    // no resolving needed since RawItem and Item consist of identical attributes and types
	return rawUsers;
}





 /**
 * Returns one user with a specific id.
 *
 * @param {import("sqlite").Database} db
 * @param {number} id
 * @returns {Promise<User | undefined>}
 */
export async function getById(db, id) {
    debug("getById id = %d", id);
    /** @type  {RawUser | undefined} */
    const rawUser = await db.get(SQL`SELECT * FROM User WHERE id=${id}`);
    // no resolving needed since RawUser and User consist of identical attributes and types
    return rawUser;
}




/**
 * Checks if the username already exists.
 * 
 * @param {import("sqlite").Database} db 
 * @param {string} username
 * @returns {Promise<User | undefined>}
 */
export async function getByUsername(db, username) {
    debug("getByUsername username = %s", username);
    /** @type {RawUser | undefined} */
    const rawUser = await db.get(SQL `SELECT * FROM User WHERE username=${username}`);
    // no resolving needed since RawUser and User consist of identical attributes and types
    return rawUser;
}





/**
 * Adds a new user to the database.
 *
 * @param {import("sqlite").Database} db
 * @param {Omit<User, "id">} user
 * @returns {Promise<number | undefined>}
 */
export async function add(db, user) {
    debug("add user = %o", user);
    const result = await db.run(SQL`
        INSERT INTO User (name, username, password, role, archived) 
        VALUES (${user.name}, ${user.username}, ${user.password}, ${user.role}, 0)
    `);
    return result.lastID;
}





/**
 * Sets a user with a specific id to archived.
 * 
 * @param {import("sqlite").Database} db 
 * @param {number} id 
 */
export async function setArchived(db, id) {
    debug("setArchived id = %d", id);
    const result = await db.run(SQL`UPDATE User SET archived=1 WHERE id=${id}`);
    return result.changes;
}





/**
 * Deletes a user with a specific id from the database.
 *
 * @param {import("sqlite").Database} db
 * @param {number} id
 * @returns {Promise<number | undefined>}
 */
export async function deleteById(db, id) {
    debug("deleteById id = %d", id);
    const result = await db.run(SQL`DELETE FROM User WHERE id=${id}`);
    return result.changes;
}