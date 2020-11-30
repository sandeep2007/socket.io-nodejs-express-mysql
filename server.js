require('dotenv/config')
const express = require('express')
const cors = require('cors')

app = express()
app.use(cors())

const auth = require('./app/auth')
app.use('/auth', auth)

const multer = require('multer');
const formData = multer();
app.use(formData.array());

const userHandler = require('./lib/userHandler');

app.get('/info', (req, res) => {
    res.json({
        name: "API Server",
        version: "1.0.0"
    })
})

const server = app.listen(process.env.PORT, () => {
    console.log("Server running at http://0.0.0.0:" + process.env.PORT)
});

const io = require('socket.io')(server, {
    cors: {
        origin: '*',
    },
    path: '/test'
});

app.get("/", function (req, res, next) {
    res.sendFile(__dirname + "/public/index.html");
});
app.use(express.static("public"));

io.use(async (socket, next) => {
    let token = await socket.handshake.query.token;
    let isToken = await userHandler.verifyToken(token, socket);
    if (isToken) {
        next();
    }
    return next(new Error('authentication error'));
});

io.on('connection', async (socket) => {
    console.log('User connected ' + socket.id);

    socket.on('ping', (data) => {
        socket.emit('pong', data);
    });

    let userList = await userHandler.userList();
    io.emit('user_list', userList);

    socket.on('disconnect', async () => {
        console.log('user disconnected ' + socket.id);
        await userHandler.deleteUserToken(socket);
        let userList = await userHandler.userList();
        io.emit('user_list', userList);
    });

});

