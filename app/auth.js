const express = require('express')
const router = express.Router()

const dateFormat = require('dateformat');

const Database = require('../lib/Database')
const conn = new Database()

const multer = require('multer');
const formData = multer();
app.use(formData.array());

router.post('/login', async (req, res) => {

    try {

        let rows = await conn.query("SELECT t1.token from users as t1 where t1.email='" + req.body.email + "' and t1.password='" + req.body.password + "' LIMIT 1")
        if (rows[0]) {
            res.status(200).json({ data: rows[0], message: 'Success' })
        }
        else {
            res.status(404).json({ data: [], message: 'Not found' })
        }

    }
    catch (err) {
        res.status(403).json({ message: err });
    }
    res.send()
})

module.exports = router