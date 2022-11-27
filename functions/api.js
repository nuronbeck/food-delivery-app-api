// require('dotenv').config()
const express = require('express');
const serverless = require('serverless-http');
const bodyParser = require('body-parser');

// const faunadb = require('faunadb');
// const q = faunadb.query;

// Instantiate a client
// const client = new faunadb.Client({
//   secret: process.env.FAUNADB_SECRET,
//   domain: process.env.FAUNADB_ENDPOINT,
//   port: port,
//   scheme: scheme,
// });

const app = express();
const router = express.Router();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// API Gateways
router.post('/auth/', function (req, res) {
  const { email, password } = req.body;
  
  res.json({
    email,
    token: 'XLJAJSLWEDBsd123KGYSDGCJDBQSHD123GBASBDsbdhasd'
  });
});

router.post('/auth/login', function (req, res) {
  const { email, password } = req.body;
  
  res.json({
    email,
    token: 'XLJAJSLWEDBsd123KGYSDGCJDBQSHD123GBASBDsbdhasd'
  });
});

app.use('/api', router);
app.use('*', (_, res) => res.send(404));

module.exports.handler = serverless(app);