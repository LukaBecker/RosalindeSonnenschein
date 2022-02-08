//@ts-check
import Koa from "koa";
import http from "http";
import router from "./router.js";
import views from "koa-views";
import serve from "koa-static";
import session from "koa-session";
import SQLite3Store from "koa-sqlite3-session";
import { provideAuth, provideFlash } from "./controller/login.js";

/**
 * @typedef {{ user?: import("./model/user.js").User, isAuth: boolean }} CustomState
 * @typedef {import('koa').DefaultState & CustomState} State
 * @typedef {{ user?: import("./model/user.js").User} & session.Session} Session
 * @typedef {{ db: import("sqlite").Database, session: Session }} CustomContext
 * @typedef {import('koa').DefaultContext & CustomContext} Context
 * @typedef {import('@koa/router').Middleware<State, Context>} Controller
 */

 /**
  * 
  * @param {{port:number, db:import("sqlite").Database}} config 
  */
export default async function webApp(config) {
  /**
   * @type {Koa<State, Context>}
   */
  const app = new Koa();
  app.context.db = config.db;
  await app.context.db.run("PRAGMA foreign_keys = ON");
  app.keys = ['9)!G[V-.8HLCALY_W/SX6/!(y:)G04R'];

  /** Middleware */
  app.use(session({ store: new SQLite3Store("data/session.sqlite") }, /** @type {any} */ (app)));
  app.use(provideAuth);
  app.use(provideFlash);
  app.use(router.routes()); 
  app.use(serve(process.cwd() + "/public")); //Aufruf der statischen Dateien, hier ggf später Namen des Ordners anpassen

  const templateDir = process.cwd() + "/views";
  const render = views(templateDir, {
    extension: "html",
    map: { html: "nunjucks" },
    options: {
      nunjucks: { loader: templateDir },
    },
  });

  app.context.render = render();
  
  return http.createServer(app.callback()).listen(config.port, () => {
    console.log(`Listening on port ${config.port}`);
  });
}
