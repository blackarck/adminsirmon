const express = require('express');
const app = express();
const fs = require('fs');
const https = require('https');
const session = require('express-session');
const bodyParser = require('body-parser');
const authjs = require('./routes/auth');
const clientjs = require('./routes/client');
const utiljs = require('./routes/util');
const cors = require('cors');
app.use(express.json());
app.use(cors());

app.use('/api/user', authjs);
app.use('/api/client', clientjs);
app.use('/api/util', utiljs);

app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

/*
const port = process.env.port || 3000;
app.listen(port, () => console.log('Listening to port ' + port));
*/
https.createServer({
        key: fs.readFileSync('./encryption/server.key'),
        cert: fs.readFileSync('./encryption/server.cert')
    }, app)
    .listen(3000, function() {
        console.log('Example app listening on port 3000! Go to https://localhost:3000/')
    })