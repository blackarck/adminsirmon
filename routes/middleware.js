let jwt = require('jsonwebtoken');
const config = require('./config.js');

let userid = "";

let checkToken = (req, res, next) => {
    let token = req.headers['x-access-token'] || req.headers['authorization']; // Express headers are auto converted to lowercase


    if (token) {

        if (token.startsWith('Bearer ')) {
            // Remove Bearer from string
            token = token.slice(7, token.length);
        }
        //console.log("Token is " + token);
        jwt.verify(token, config.secret, (err, decoded) => {
            if (err) {
                console.log("Error " + err);
                return res.json({
                    success: false,
                    message: 'Token is not valid'
                });
                // next();
            } else {
                req.decoded = decoded;
                //console.log("Decoded " + JSON.stringify(decoded, null, 2));
                //console.log("Decoded " + req.decoded.userid1);
                userid = req.decoded.userid1;
                //return
                /* return res.json({
                    success: true,
                    message: ' Token is validl',
                    user: userid
                });
                */
                next();
            }
        });
    } else {
        return res.json({
            success: false,
            message: 'Auth token is not supplied'
        });
    }
};

let getuserid = () => {
    return userid;
}

module.exports = {
    checkToken: checkToken,
    getuserid: getuserid
}