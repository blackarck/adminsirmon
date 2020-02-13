const router = require('express').Router();
const middleware = require('./middleware');
const dbhelper = require('./databasehelper');
const nodemailer = require("nodemailer");
const dotenv = require('dotenv');
const setclient = require('./clientdtl');
var clientcon = dbhelper.getconnection();
const bcrypt = require('bcrypt');
const saltRounds = 10;
const salt = bcrypt.genSaltSync(saltRounds);
const Email = require('email-templates');
const date = require('date-and-time');

dotenv.config();

router.post('/reviewpass', (req, res) => {
    //console.log("Receiving request for password reset " + req.params.id);
    //read token and validate whether its valid one hr and a user exists whose password needs reset
    const stmt = "SELECT user_valid.userid,createdon, randstring, DATE_ADD(createdon,INTERVAL 45 MINUTE)>CURRENT_TIMESTAMP() as timeleft,user.emailid,user_name FROM user_valid, user where user.userid=user_valid.userid and randstring=?";
    const stmtval = [req.body.passedtoken];
    clientcon.query(stmt, stmtval, function(err, rows, fields) {
        if (err) {
            console.log("DB Error " + err);
        } else {
            if (rows.length > 0) {
                if (rows[0].timeleft == '1') {
                    //time left
                    const password1 = req.body.password1;
                    var hashpwd = bcrypt.hashSync(password1, salt);
                    var stmt = "update user set active='0', password=? where userid=?";
                    var stmtval = [hashpwd, rows[0].userid];
                    clientcon.query(stmt, stmtval, function(err, rows1, fields) {
                        if (err) {
                            console.log("DB Error " + err);
                        } else {
                            var stmt = "delete FROM `user_valid` where randstring=? ";
                            clientcon.query(stmt, [req.body.passedtoken], function(err, rows2, fields) {
                                if (err) {
                                    console.log("DB Error " + err);
                                } else { console.log("Delete failed"); } //end of else
                            });
                            const transporter = getTransporter();
                            //send password reset confirmation email
                            const email = new Email({
                                message: {
                                    from: process.env.EMAILID,
                                },
                                // uncomment below to send emails in development/test env:
                                send: true,
                                transport: transporter,
                                views: { root: __dirname },
                            });

                            email
                                .send({
                                    template: 'resetpwd',
                                    message: {
                                        to: rows[0].emailid,
                                    },
                                    locals: {
                                        name: rows[0].user_name
                                    },
                                })
                                .then(resp => {
                                    console.log("Email sent out 1 ");
                                    return res.json({
                                        success: true,
                                        message: 'Password reset success'
                                    });
                                })
                                .catch(error => {
                                    console.log("error in house " + error);

                                });
                            //end of send password reset conrfirmation email
                        } //end of else
                    });
                } else {
                    //url expired
                    res.status(400).json({
                        success: false,
                        message: 'URL expired ! Contact your System Administrator'
                    });
                }
            } else {
                res.status(400).json({
                    success: false,
                    message: 'User not found! Contact your System Administrator'
                });
            } //end of else
        } //end of statement execution else
    });
}); //end of reouter /reviewpass


router.post('/suemail', middleware.checkToken, (req, res) => {
    console.log("Sending email to super admin " + req.body.message);

    var transporter = getTransporter();
    var userid = middleware.getuserid();
    var msg;
    var useremailid;
    var clientid;
    const stmt = "select clientid,userid,emailid,user_name,phone,role from user where userid=?";

    clientcon.query(stmt, [userid], function(err, rows, fields) {
        if (err) {
            console.log("DB Error " + err);
        } else {
            msg = rows[0].username + ' has requested to modify his personal information with message ' + req.body.message;
            useremailid = rows[0].emailid;
            clientid = rows[0].clientid;
            console.log("client1 id is " + clientid);

            //setclient.setClient(clientid);
            setclient.setClient(clientid).then(result => {
                    // console.log(result.clientname);
                    //console.log("Client1 name is " + result.clientname);
                    //console.log("Sending email for " + useremailid + " to " + result.contactemail + " With message " + msg);
                    var mailOptions = {
                        from: process.env.EMAILID,
                        to: result.contactemail,
                        subject: 'User ' + useremailid + ' request to edit personal information',
                        text: msg
                    };


                    transporter.sendMail(mailOptions, function(error, info) {
                        if (error) {
                            console.log(error);
                            return res.json({
                                success: false,
                                message: 'error in sending email'
                            });
                        } else {
                            console.log('Email sent: ' + info.response);
                            return res.json({
                                success: true,
                                message: 'email sent out'
                            });
                        }
                    });

                    //end of transporter send email
                })
                .catch(err =>
                    console.log("Error in setClient callback " + err));
        }
    });
});

router.get('/getroles', middleware.checkToken, (req, res) => {
    //console.log("Start get roles");
    const stmt = "select role from roles where active='0' and role<>'suadmin'";

    clientcon.query(stmt, [middleware.getuserid()], function(err, rows, fields) {
        if (err) {
            console.log("DB Error " + err);
        } else {
            //console.log("Result fetched " + rows);
            var obj1 = { success: true, message: 'result fetched' };
            var object3 = Object.assign(obj1, rows);
            res.json(object3);
        }
    });
    //clientcon.end();
}); //end of router get for getroles

//middleware.checkToken,
router.get('/getavlblsts', (req, res) => {
    const now = new Date();
    //console.log("Getting getavlblsts request " + req.query.clientid + " date " + date.format(now, 'DD-MMM-YYYY'));
    const stmt = "SELECT distinct SERVER_TYPE FROM `server_log` where clientid=? and  date(lastupddttm)=STR_TO_DATE(?,'%d-%M-%Y')";

    clientcon.query(stmt, [req.query.clientid, date.format(now, 'DD-MMM-YYYY')], function(err, rows, fields) {
        if (err) {
            console.log("DB Error " + err);
        } else {
            //console.log("rows length is " + rows.length);
            if (rows.length > 0) {
                rows.forEach(element => {
                    console.log("Row elements are " + element.SERVER_TYPE);
                    //for each server get the availability for today and yesterday
                    //structure for response is servertype   date  app% web% db%
                    var succfig;
                    var srvname = element.SERVER_TYPE;
                    getServerAvlbl(req.query.clientid, srvname, date.format(now, 'DD-MMM-YYYY')).then(result => {
                        succfig = result.avlbltprcnt;
                        console.log("Success figure for server " + srvname + " is " + succfig);
                    }).catch(err =>
                        console.log("Error in getserveravlbl callback " + err));
                    //will have to chain multiple promises here.
                });

                var obj1 = { success: true, message: 'result fetched' };
                var object3 = Object.assign(obj1, rows);
                res.json(object3);
            } else {
                //return error
                console.log("Getting error here ");
            }

        }
    });

}); //end of router for getavlblsts

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

getServerAvlbl = (clientid, servertype, dates) => {
        return new Promise((resolve, reject) => {
            var avlbltprcnt = 0;
            //console.log("Input params are " + clientid + " servtype " + servertype + " dates " + dates);
            stmt = "SELECT count(*) as succfig FROM `server_log` where date(lastupddttm)= STR_TO_DATE(?,'%d-%M-%Y') and clientid=? and server_type=? and server_status='Success-OK'";
            clientcon.query(stmt, [dates, clientid, servertype], function(err, rows, fields) {
                if (err) {
                    console.log("DB Error " + err);
                } else {
                    //console.log("rows length is " + rows.length);
                    if (rows.length > 0) {
                        resolve({
                            avlbltprcnt: rows[0].succfig
                                // console.log("succ figure is " + avlbltprcnt + " for server " + servertype);
                        })
                    } //end of if
                } //end of else
            });
        }); //end of promise
    } //end of function getserveravlbl

module.exports = router;