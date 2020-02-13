const router = require('express').Router();
const mysql = require('mysql');
const dotenv = require('dotenv');
const middleware = require('./middleware');
const dbhelper = require('./databasehelper');
const cryptoRandomString = require('crypto-random-string');
const util = require('./util');
const nodemailer = require("nodemailer");
const Email = require('email-templates');
const fs = require('fs');
const stream = require('stream');
var clientcon = dbhelper.getconnection();

dotenv.config();

router.get('/userid', middleware.checkToken, (req, res) => {
    //console.log("logged in user is " + middleware.getuserid());
    //console.log("User id api call");
    // res.send([1, 2, 3]);
    //return userid, username, emailid, phone

    const stmt = "select user.clientid,userid,emailid,user_name,phone,role,client_name from user,clients where user.clientid=clients.clientid and userid=?";

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
    var stmt = "Select max(userid)+1 as userid from lastusrid";
    var useridmax = "";
    var genpwd = cryptoRandomString({ length: 10 });


    clientcon.query(stmt, function(err, rows, fields) {
        if (err) {
            console.log("DB Error in selecting max " + err);
        } else {
            useridmax = rows[0].userid;
            stmt = "update lastusrid set userid= ?";
            clientcon.query(stmt, [useridmax], function(err, rows, fields) {
                if (err) {
                    console.log("DB Error in updating lastusrid" + err);
                } else {
                    stmt = "INSERT INTO `user`(`clientid`, `userid`, `emailid`, `user_name`, `password`, `phone`, `role`, `active`) VALUES (?,?,?,?,?,?,?,?)"
                    const stmtval = [req.body.clientid, useridmax, req.body.emailid, req.body.username, genpwd, req.body.phone, req.body.role, 1];
                    clientcon.query(stmt, stmtval, function(err, rows, fields) {
                        if (err) {
                            console.log("DB Error in insert user:" + err);
                        } else {
                            res.json(resetPwd(useridmax, req.body.emailid, req.body.username));
                        } //end of else
                    }); //end of update query
                } //end of else
            }); //end of client fetch max value 
        } //end of else
    });
});

router.get('/getusers', middleware.checkToken, (req, res) => {
    var userrole;
    getUserRole(middleware.getuserid()).then(result => {
        userrole = result.userrole;
        //console.log("User role is " + userrole);
        var stmt;
        var flag = 0;
        var stmt = "select user.clientid,userid,emailid, user_name,phone,role,active,client_name from user,clients where user.clientid=clients.clientid ";
        if (userrole == 'suadmin') {
            flag = 1;
        }
        if (userrole == 'admin') {
            stmt = stmt + " and user.clientid= " + result.clientid;
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

router.post('/resetpwd', (req, res) => {
    console.log("Recieved request for password reset " + req.body.userid);
    res.json(resetPwd(req.body.userid, req.body.emailid, req.body.username));

}); //end of router for resetpwd

router.get('/clientid/:clientid', (req, res) => {
    res.send('Input param are ' + req.params.clientid);
    //pass url as /api/clientid/:clientid/vivek -> route param
    //for query param use optional input res.query.id
});

router.get('/images/:clientid', (req, res) => {
    //console.log("clientid is " + req.params.clientid);
    var imgname;
    const stmt = "select imagename from clientimg where clientid=?";
    clientcon.query(stmt, [req.params.clientid], function(err, rows, fields) {
        if (err) {
            console.log("DB Error " + err);
            return res.sendStatus(400);
        } else {
            if (rows.length > 0) {
                imgname = rows[0].imagename;
                //console.log("image name is " + imgname);
                const r = fs.createReadStream('./images/' + imgname) // or any other way to get a readable stream
                const ps = new stream.PassThrough() // <---- this makes a trick with stream error handling
                stream.pipeline(
                    r,
                    ps, // <---- this makes a trick with stream error handling
                    (err) => {
                        if (err) {
                            console.log(err) // No such file or any other kind of error
                            return res.sendStatus(400);
                        }
                    })
                ps.pipe(res) // <---- this makes a trick with stream error handling
            } //end of if count is there
            else {
                return res.sendStatus(400);
            }
        } //end of else for query success
    });

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

const getTransporter = () => {
    let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.EMAILID, // generated ethereal user
            pass: process.env.EMAILPWD // generated ethereal password
        }
    });

    return transporter;
};

const resetPwd = (useridpass, emailidpass, username) => {
        //here we will generate random token and send it in an email
        var randstring = cryptoRandomString({ length: 15, type: 'url-safe' });
        //delete any previous requests from this user
        delUserValid(useridpass);
        var stmt = "INSERT INTO `user_valid` (`userid`, `createdon`, `randstring`) VALUES (?,?,?)";
        let now = new Date();
        var transporter = getTransporter();
        const stmtval = [useridpass, now, randstring];

        if (username.length > 0) {} else {
            username = 'user';
        }

        clientcon.query(stmt, stmtval, function(err, rows, fields) {
            if (err) {
                console.log("DB Error in insert user_valid :" + err);
            } else {
                //send email to user here
                //*************testing email functions */

                const email = new Email({
                    message: {
                        from: process.env.EMAILID,
                    },
                    // uncomment below to send emails in development/test env:
                    send: true,
                    transport: transporter,
                    views: { root: __dirname },
                });
                var url = process.env.DOMAIN + ":" + process.env.port + "/reviewpass?token=" + randstring;
                //console.log("url is " + url);
                email
                    .send({
                        template: 'adduser',
                        message: {
                            to: emailidpass,
                        },
                        locals: {
                            name: username,
                            urlstring: url,
                        },
                    })
                    .then(resp => {
                        //console.log("Email sent out 1 " + resp.originalMessage);
                        var obj1 = { success: true, message: 'User Registered, registration email sent out.' };
                        return (obj1);
                        //res.json(obj1);
                    })
                    .catch(error => {
                        console.log("error in house " + error);
                    });
                //*************testing eamil functions end */
            }
        }); //end of sql thingy
    } //end of resetPwd


const delUserValid = (useridpass) => {
        var stmt = "delete from `user_valid` where `userid` =? ";
        clientcon.query(stmt, [useridpass], function(err, rows, fields) {
            if (err) {
                console.log("DB Error in insert user_valid :" + err);
            } else {
                return true;
            } //end of else
        });
    } //end of function delUserVAlid

module.exports = router;