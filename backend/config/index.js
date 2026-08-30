require ("dotenv").config();

const db = require("./db");
const secret = require("./secret");
const web = require("./web");

const config = {
  db,
  secret,
  web,
};

//config.get("db.host")

function get(path) {
    // "db.host"
    const keys = path.split(".");// ==> db host
    let result = config;

    for (const key of keys) {
        result = result[key];// db ==> host

        if (result === undefined) throw new Error(`not found ${path}`);
    }

    return result;
}

module.exports = {
    get
};