const router = require('express').Router();
const mysql = require('mysql');
const dotenv = require('dotenv');
const middleware = require('./middleware');
const dbhelper = require('./databasehelper');

var clientcon = dbhelper.getconnection();

router.get('/userid', middleware.checkToken, (req, res) => {
    //console.log("logged in user is " + middleware.getuserid());
    //console.log("User id api call");
    // res.send([1, 2, 3]);
    //return userid, username, emailid, phone

    const stmt = "select clientid,userid,emailid,user_name,phone,role from user where userid=?";

    clientcon.query(stmt, [middleware.getuserid()], function(err, rows, fields) {
        if (err) {
            console.log("DB Error " + err);
        } else {
            var obj1 = { success: true, message: 'result fetched' };
            var object3 = Object.assign(obj1, rows);
            res.json(object3);
        }
    });
    //clientcon.end();
});

router.get('/clientid/:clientid', (req, res) => {
    res.send('Input param are ' + req.params.clientid);
    //pass url as /api/clientid/:clientid/vivek -> route param
    //for query param use optional input res.query.id
});

module.exports = router;