const router = require('express').Router();
const middleware = require('./middleware');
const dbhelper = require('./databasehelper');
const nodemailer = require("nodemailer");
const dotenv = require('dotenv');
const setclient = require('./clientdtl');
var clientcon = dbhelper.getconnection();


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


module.exports = router;