const router = require('express').Router();
const mysql = require('mysql');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('./config');
const middleware = require('./middleware');
const validatedata = require('./validate');
const dbhelper = require('./databasehelper');
const saltRounds = 10;
var salt = bcrypt.genSaltSync(saltRounds);

dotenv.config();



router.post('/register', (req, res) => {

    const regerror = validatedata.regvalidation(req.body);
    //console.log("Error is " + regerror);
    if (regerror.error) return res.send(regerror.error.details[0].message);

    var connection = dbhelper.getconnection();

    const userid1 = req.body.userid;
    const username = req.body.username;
    const password1 = req.body.password;
    const emailid1 = req.body.emailid;
    const phone1 = req.body.phone;
    const clientid1 = req.body.clientid;
    const role = req.body.role;

    var hashpwd = bcrypt.hashSync(password1, salt);

    //console.log("Values are " + userid1 + " Clntid " + clientid1 + " ")
    //handle error for duplicate insert
    const stmt = "Insert into user (clientid,userid,emailid,user_name,password,phone,role) VALUES (?,?,?,?,?,?,?)";
    const stmtval = [clientid1, userid1, emailid1, username, hashpwd, phone1, role];
    connection.query(stmt, stmtval, function(err, rows, fields) {
        if (err) throw err
        else {
            //console.log('The solution is: ', rows);
            res.send("Insert successfull");
        }
    });
    //connection.end();
}); // end of register function


router.post('/login', (req, res) => {

    const logerror = validatedata.loginvalidlation(req.body);
    //console.log("Error is " + logerror.error.details[0].message);
    if (logerror.error) return res.json({
        success: false,
        message: logerror.error.details[0].message
    });

    const userid1 = req.body.userid;
    const hashpwd = req.body.password;
    var connection = dbhelper.getconnection();

    //console.log("user id is " + userid1);
    let resmsg = "";
    connection.query('SELECT userid,emailid,user_name,password,clientid from user where userid =?', [userid1], function(err, rows, fields) {
        if (err) {
            //console.error("Error in executing query " + err.stack);
            return res.send("SQL Error cannot execute query");
        } else {
            //console.log('The user id  is: ' + rows);
            if (rows.length > 0) {
                //resmsg = "user found hello " + rows[0].user_name;
                //console.log("user id has value " + rows[0].userid);
                var pwdmatch = false;
                pwdmatch = bcrypt.compareSync(hashpwd, rows[0].password);
                //console.log("Password match is " + pwdmatch);

                if (pwdmatch) {
                    let token = jwt.sign({ userid1: userid1 },
                        config.secret, {
                            expiresIn: '1h' // expires in 24 hours
                        }
                    );
                    console.log(" sending authentication token ");
                    return res.json({
                        success: true,
                        message: 'Authentication successful!',
                        token: token
                    });
                } else {
                    //console.log("password error");

                    res.status(403).json({
                        success: false,
                        message: 'Incorrect username or password'
                    });
                    return;
                }
            } else {
                //console.log("user not found");

                res.status(400).json({
                    success: false,
                    message: 'Authentication failed! Please check the request'
                });
                return;
            }
        }
    });
    // connection.end()
});

module.exports = router;