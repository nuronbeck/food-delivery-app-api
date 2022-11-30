require('dotenv').config({ path: '../.env' })
const express = require('express');
const serverless = require('serverless-http');
const bodyParser = require('body-parser');
// const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');

const faunadb = require('faunadb');
const q = faunadb.query;

// Instantiate a client
const client = new faunadb.Client({
  secret: process.env.FAUNA_API_KEY,
  domain: process.env.FAUNA_DOMAIN,
  port: 443,
  scheme: 'https',
});

// App middlewares
const authMiddleware = (req, res, next) => {
  const token = req.headers["authorization"];

  if (!token) {
    return res.status(403).send({
      message: 'A token is required for authentication!'
    });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_TOKEN);
    req.user = decoded;
  } catch (err) {
    return res.status(401).send({
      message: 'Invalid Token!'
    });
  }
  return next();
};

const app = express();
const router = express.Router();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// API Gateways
router.post('/auth', authMiddleware, (req, res) => {
  const { user: { iat, exp, ...user } } = req;
  
  res.json({
    user,
    token: 'XLJAJSLWEDBsd123KGYSDGCJDBQSHD123GBASBDsbdhasd'
  });
});

router.post('/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!(email && password)) {
      throw ({
        message: 'Payload fields validation error!',
        errors: {
          email: !email ? 'Field "email" is requied!' : undefined,
          password: !password ? 'Field "password" is requied!' : undefined
        }
      })
    }
      
    res.json({
      email,
      token: 'XLJAJSLWEDBsd123KGYSDGCJDBQSHD123GBASBDsbdhasd'
    });
  } catch (error) {
    res.json(error)
  }
});

router.post('/auth/sign-up', async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    if (!(firstName && lastName && email && password)) {
      throw ({
        message: 'Payload fields validation error!',
        errors: {
          firstName: !firstName ? 'Field "firstName" is requied!' : undefined,
          lastName: !lastName ? 'Field "lastName" is requied!' : undefined,
          email: !email ? 'Field "email" is requied!' : undefined,
          password: !password ? 'Field "password" is requied!' : undefined
        }
      })
    }

    const { isUserExist, user } = await client.query(
      q.Let(
        {
          emailIsAlreadyExist: q.GT(
            q.Count(
              q.Select(
                ['data'],
                q.Map(
                  q.Paginate(q.Match(q.Index('userByEmail'), email), { size: 999 }),
                  q.Lambda('x', q.Get(q.Var('x')))
                ),
                []
              )
            ),
            0
          ),
          createUser: 
          q.If(
            q.Not(q.Var('emailIsAlreadyExist')),
            q.Create(q.Collection('users'), {
              data: {
                firstName,
                lastName,
                email,
                password
              }
            }),
            {}
          )
        },
        {
          isUserExist: q.Var('emailIsAlreadyExist'),
          user: q.If(
            q.Not(q.Var('emailIsAlreadyExist')),
            {
              id: q.Select(["ref", "id"], q.Var('createUser'), undefined),
              firstName: q.Select(["data", "firstName"], q.Var('createUser'), undefined),
              lastName: q.Select(["data", "lastName"], q.Var('createUser'), undefined),
              email: q.Select(["data", "email"], q.Var('createUser'), undefined),
            },
            {}
          )
        }
      )
    );

    if(isUserExist){
      throw ({
        message: 'User is already exist!',
        user
      })
    }

    const token = jwt.sign({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    }, process.env.JWT_SECRET_TOKEN, { expiresIn: "5h" });

    res.json({
      message: "User is signed up successfully!",
      user,
      token
    })
  } catch (error) {
    res.json(error)
  }
})

app.use('/api', router);
app.use('*', (_, res) => res.send(404));

module.exports.handler = serverless(app);