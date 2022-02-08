//@ts-check
import SQL from "sql-template-strings";
import Debug from 'debug';

const debug = Debug("rs:model:role");

/**
 * A role as saved in the database
 * @typedef RawRole
 * @property {number} id
 * @property {string} title
 */

/**
 * A role resolved to continue working with
 * @typedef Role
 * @property {number} id
 * @property {string} title
 */





 /**
 * Returns all userss in an array.
 *
 * @param {import("sqlite").Database} db
 * @returns {Promise<Role[]>}
 */
export async function getAll(db) {
    debug("getAll");
    /** @type {RawRole[]} */
    const rawRoles = await db.all(SQL`SELECT * FROM Role`);
    // no resolving needed since RawRole and Role consist of identical attributes and types
	return rawRoles;
}





/**
 * Returns one user with a specific id.
 *
 * @param {import("sqlite").Database} db
 * @param {number} id
 * @returns {Promise<Role | undefined>}
 */
export async function getById(db, id) {
    debug("getById id = %d", id);
    /** @type  {RawRole | undefined} */
    const rawRole = await db.get(SQL`SELECT * FROM Role WHERE id=${id}`);
    // no resolving needed since RawRole and Role consist of identical attributes and types
    return rawRole;
}