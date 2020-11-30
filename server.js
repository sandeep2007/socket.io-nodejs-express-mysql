require('dotenv/config')
const express = require('express')
const cors = require('cors')
//const multer = require('multer');

const dateFormat = require('dateformat');

const Database = require('./lib/Database')
const conn = new Database()

// const io = require('socket.io')();
// console.log(io)
app = express()
app.use(cors())
// app.use((req, res, next) => {
//     res.set('Access-Control-Allow-Origin', '*');
//     next()
// });

//const formData = multer();

//app.use(formData.array());

// const demo = require('./app/demo')
// app.use('/demo', demo)

const auth = require('./app/auth')
app.use('/auth', auth)

app.get('/info', (req, res) => {
    res.json({
        name: "API Server",
        version: "1.0.0"
    })
})

const server = app.listen(process.env.PORT, () => {
    console.log("Server running at http://127.0.0.1:" + process.env.PORT)
});

const io = require('socket.io')(server, {
    cors: {
        origin: '*',
    },
    path: '/test'
});

const isEmpty = (value) => {
    var isEmptyObject = function (a) {
        if (typeof a.length === 'undefined') { // it's an Object, not an Array
            var hasNonempty = Object.keys(a).some(function nonEmpty(element) {
                return !isEmpty(a[element]);
            });
            return hasNonempty ? false : isEmptyObject(Object.keys(a));
        }

        return !a.some(function nonEmpty(element) { // check if array is really not empty as JS thinks
            return !isEmpty(element); // at least one element should be non-empty
        });
    };
    return (
        value == false
        || typeof value === 'undefined'
        || value == null
        || (typeof value === 'object' && isEmptyObject(value))
    );
}

app.get("/", function (req, res, next) {
    res.sendFile(__dirname + "/public/index.html");
});
app.use(express.static("public"));

io.use((socket, next) => {
    let token = socket.handshake.query.token;
    conn.query("SELECT t1.token from users as t1 WHERE t1.token='" + token + "' LIMIT 1").then((data) => {

        if (token === data[0].token) {
            conn.query("select id from socket_users where token='" + token + "'").then((data1) => {

                if (isEmpty(data1)) {
                    conn.query("Insert into socket_users(token,socket_id,date_created) values('" + token + "','" + socket.id + "','" + dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss") + "')").then(() => {
                        return next();
                    });
                }
                else {
                    conn.query("update socket_users set socket_id='" + socket.id + "' where token='" + token + "'").then(() => {
                        return next();
                    });
                }
            });


        }
        return next(new Error('authentication error'));
    });

});

io.on('connection', (socket) => {
    console.log('a user connected ' + socket.id);
    //socket.emit('announcements', { message: 'A new user has joined! ' + socket.id });

    socket.on('ping', (data) => {
        socket.emit('pong', data);
    });

    socket.emit('user_connect', socket.id);

    conn.query("select t1.*,t2.socket_id from users as t1 left join socket_users as t2 on t2.token=t1.token").then((data) => {
        io.emit('user_list', data);
    });

    socket.on('disconnect', () => {
        console.log('user disconnected');
        conn.query("delete from socket_users where socket_id='" + socket.id + "'");
        conn.query("select t1.*,t2.socket_id from users as t1 left join socket_users as t2 on t2.token=t1.token").then((data) => {
            io.emit('user_list', data);
        });
        // socket.emit('user_disconnect', socket.id);
    });


});

