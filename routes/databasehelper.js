const mysql = require('mysql');
const dotenv = require('dotenv');

dotenv.config();

const getconnection = () => {
    var connection = mysql.createConnection({
        host: process.env.DBUSERNAME,
        user: process.env.DBUSERID,
        password: process.env.DBPWD,
        database: 'sirmonserv'
    });

    connection.connect(function(err) {
        if (err) {
            //console.error('error connecting: ' + err.stack);
            return console.log("Error connecting to database ");
        } else {
            //  console.log("Connected to database");
        }
    });

    return connection;
};



module.exports.getconnection = getconnection;