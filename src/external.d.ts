declare module "koa-sqlite3-session" {
    import { stores, Session, opts } from "koa-session";

    type options = { verbose?: true, ttl?: number, interval?: number }

    class SQLite3Store implements stores {
        constructor(filwName: string, options?: options)
        get(key: string): Promise<any>;
        set(key: string, sess: Partial<Session> & { _expire?: number, _maxAge?: number }, ttl: opts["maxAge"]): Promise<any>;
        destroy(key: string): Promise<any>;
    } 

    export = SQLite3Store
}