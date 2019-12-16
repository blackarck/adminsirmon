const router = require('express').Router();
const mysql = require('mysql');
const dotenv = require('dotenv');
const middleware = require('./middleware');

router.get('/clientid', middleware.checkToken, (req, res) => {
    //console.log("logged in user is " + middleware.getuserid());
    res.send([1, 2, 3]);
});

router.get('/clientid/:clientid', (req, res) => {
    res.send('Input param are ' + req.params.clientid);

    //pass url as /api/clientid/:clientid/vivek -> route param
    //for query param use optional input res.query.id
});

module.exports = router;