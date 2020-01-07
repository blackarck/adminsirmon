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

router.get('/getclient', middleware.checkToken, (req, res) => {
    var userrole;
    getUserRole(middleware.getuserid()).then(result => {
        userrole = result.userrole;
        //console.log("User role is " + userrole);
        var stmt;
        var flag = 0;
        if (userrole == 'suadmin') {
            stmt = "select clientid,client_name,contact_email, contact_name,address1,address2,city,state,country from clients ";
            flag = 1;
        }
        if (userrole == 'admin') {
            stmt = "select clientid,client_name,contact_email, contact_name,address1,address2,city,state,country from clients ";
            stmt = stmt + " where clientid= " + result.clientid;
            flag = 1;
        }
        //console.log("starting getclient data ");
        if (flag == 1) {
            clientcon.query(stmt, function(err, rows, fields) {
                if (err) {
                    console.log("DB Error " + err);
                } else {
                    //console.log("Returning getclient data ");
                    var obj1 = { success: true, message: 'result fetched' };
                    var object3 = Object.assign(obj1, rows);
                    res.json(object3);
                }
            });
        } else {
            var obj1 = { success: false, message: 'not authorized' };
            res.json(obj1);
        }
    }); //end of getuserrole
    //clientcon.end();
});

router.post('/updateclient', middleware.checkToken, (req, res) => {
    //console.log("Req for update of emplid to " + req.body.emailid + " contact name " + req.body.contactname + " for client " + req.body.clientid);
    const stmt = "update  clients set contact_email =? , contact_name =? where clientid=?";
    const stmtval = [req.body.emailid, req.body.contactname, req.body.clientid];

    clientcon.query(stmt, stmtval, function(err, rows, fields) {
        if (err) {
            console.log("DB Error " + err);
        } else {
            var obj1 = { success: true, message: 'Data updated' };
            res.json(obj1);
        }
    });
});
//end of router post for update client

router.post('/addclient', middleware.checkToken, (req, res) => {
    var stmt = "Select max(clientid)+1 as clientid from clients";
    var clientidmax = "";
    clientcon.query(stmt, function(err, rows, fields) {
        if (err) {
            console.log("DB Error " + err);
        } else {
            clientidmax = rows[0].clientid;
            stmt = "INSERT INTO `clients`(`clientid`,`client_name`,`contact_name`,`contact_email`,`address1`,`address2`,`city`,`state`,`country`) VALUES (?,?,?,?,?,?,?,?,?)"
            const stmtval = [clientidmax, req.body.clientname, req.body.contactname, req.body.emailid, req.body.add1, req.body.add2, req.body.city, req.body.state, req.body.country];
            clientcon.query(stmt, stmtval, function(err, rows, fields) {
                if (err) {
                    console.log("DB Error " + err);
                } else {
                    var obj1 = { success: true, message: 'Data inserted' };
                    res.json(obj1);
                }
            });
        } //end of else
    }); //end of client fetch max value 
});

router.post('/adduser', middleware.checkToken, (req, res) => {
    var stmt = "Select max(userid)+1 as userid from user";
    var useridmax = "";
    clientcon.query(stmt, function(err, rows, fields) {
        if (err) {
            console.log("DB Error " + err);
        } else {
            useridmax = rows[0].userid;
            stmt = "INSERT INTO `user`(`clientid`, `userid`, `emailid`, `user_name`, `password`, `phone`, `role`) VALUES (?,?,?,?,?,?,?)"
            const stmtval = [req.body.clientid, useridmax, req.body.contactname, req.body.emailid, req.body.add1, req.body.add2, req.body.city, req.body.state, req.body.country];
            clientcon.query(stmt, stmtval, function(err, rows, fields) {
                if (err) {
                    console.log("DB Error " + err);
                } else {
                    var obj1 = { success: true, message: 'Data inserted' };
                    res.json(obj1);
                }
            });
        } //end of else
    }); //end of client fetch max value 
});

router.get('/getusers', middleware.checkToken, (req, res) => {
    var userrole;
    getUserRole(middleware.getuserid()).then(result => {
        userrole = result.userrole;
        //console.log("User role is " + userrole);
        var stmt;
        var flag = 0;
        var stmt = "select clientid,userid,emailid, user_name,phone,role from user ";
        if (userrole == 'suadmin') {
            flag = 1;
        }
        if (userrole == 'admin') {
            stmt = stmt + " where clientid= " + result.clientid;
            flag = 1;
        }
        //console.log("starting getclient data ");
        if (flag == 1) {
            clientcon.query(stmt, function(err, rows, fields) {
                if (err) {
                    console.log("DB Error " + err);
                } else {
                    //console.log("Returning getclient data ");
                    var obj1 = { success: true, message: 'result fetched' };
                    var object3 = Object.assign(obj1, rows);
                    res.json(object3);
                }
            });
        } else {
            var obj1 = { success: false, message: 'not authorized' };
            res.json(obj1);
        }
    }); //end of getuserrole
    //clientcon.end();
});


router.post('/updateUser', middleware.checkToken, (req, res) => {
    //console.log("Req for update of emplid to " + req.body.emailid + " contact name " + req.body.contactname + " for client " + req.body.clientid);
    var userrole;
    var stmtval
    getUserRole(middleware.getuserid()).then(result => {
        userrole = result.userrole;
        var stmt;
        if (userrole == 'suadmin') {
            stmt = "update  user set emailid =? , phone =? where userid=?";
            stmtval = [req.body.emailid, req.body.phone, req.body.userid];
            flag = 1;
        }
        if (userrole == 'admin') {
            stmt = "update  user set emailid =? , phone =? , role=? where userid=? ";
            stmt = stmt + " and clientid= " + result.clientid;
            stmtval = [req.body.emailid, req.body.phone, req.body.role, req.body.userid];
            flag = 1;
        }


        clientcon.query(stmt, stmtval, function(err, rows, fields) {
            if (err) {
                console.log("DB Error " + err);
            } else {
                var obj1 = { success: true, message: 'Data updated' };
                res.json(obj1);
            }
        });
    });
});
//end of router post for update client

router.get('/clientid/:clientid', (req, res) => {
    res.send('Input param are ' + req.params.clientid, );
    //pass url as /api/clientid/:clientid/vivek -> route param
    //for query param use optional input res.query.id
});

const getUserRole = (userid) => {
    return new Promise((resolve, reject) => {
        var userrole;
        const stmt = "select clientid,userid,emailid,user_name,phone,role from user where userid=?";

        clientcon.query(stmt, [userid], function(err, rows, fields) {
            if (err) {
                console.log("DB Error " + err);
            } else {
                resolve({
                    userrole: rows[0].role,
                    useremailid: rows[0].emailid,
                    clientid: rows[0].clientid
                });
            }
        });
    });
};


module.exports = router;