const mysql = require('mysql');
const dbhelper = require('./databasehelper');

var clientcon = dbhelper.getconnection();

const setClient = (clientid) => {
    return new Promise((resolve, reject) => {
        //console.log("client id is " + clientid);
        const stmt = "select client_name,contact_name, contact_email from clients where clientid=?";

        clientcon.query(stmt, [clientid], function(err, rows, fields) {
            if (err) {
                console.log("DB Error " + err);
            } else {
                resolve({
                    clientname: rows[0].client_name,
                    contactname: rows[0].contact_name,
                    contactemail: rows[0].contact_email
                })
            }
        });
    }); //end of promise
}
module.exports.setClient = setClient;