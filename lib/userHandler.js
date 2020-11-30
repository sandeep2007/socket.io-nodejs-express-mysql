const Database = require('./Database');
const conn = new Database()

const dateFormat = require('dateformat');
const fn = require('./functions');

let obj = {};

obj.verifyToken = async (token, socket) => {
    let userData = await conn.query("SELECT t1.token from users as t1 WHERE t1.token='" + token + "' LIMIT 1");

    if (!fn.isEmpty(userData)) {
        checkUserToken = await conn.query("select id from socket_users where token='" + token + "'");
        if (fn.isEmpty(checkUserToken)) {
            await conn.query("Insert into socket_users(token,socket_id,date_created) values('" + token + "','" + socket.id + "','" + dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss") + "')");
        }
        else {
            await conn.query("update socket_users set socket_id='" + socket.id + "' where token='" + token + "'");
        }
        return true;
    }
    return false;
}

obj.userList = async () => {
    let userList = await conn.query("select t1.*,t2.socket_id from users as t1 left join socket_users as t2 on t2.token=t1.token");
    return userList;
}

obj.deleteUserToken = async (socket) => {
    await conn.query("delete from socket_users where socket_id='" + socket.id + "'");
    return true;
}

module.exports = obj;