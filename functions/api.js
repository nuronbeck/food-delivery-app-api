require('dotenv').config({ path: '../.env' })
const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const bodyParser = require('body-parser');
// const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const validator = require('validator');

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

app.use(cors({ origin: '*' }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// API Gateways
router.post('/auth', authMiddleware, (req, res) => {
  try {
    const { user: { iat, exp, ...user } } = req;

    const token = jwt.sign({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
    }, process.env.JWT_SECRET_TOKEN, { expiresIn: "5h" });

    res.json({
      user,
      token
    });
  } catch (error) {
    res.status(400).json(error);
  }
});

router.post('/auth/login', async (req, res) => {
  try {
    const errors = {};
    const { email, password } = req.body;

    if(!validator.isEmail(email)){
      errors.email = 'Field "email" is not valid email!'
    }

    if(validator.isEmpty(password)){
      errors.password = 'Field "password" is requied!'
    }

    if(Object.keys(errors).length){
      throw ({
        message: 'Payload fields validation error!',
        errors
      })
    }

    const { userExist, user } = await client.query(
      q.Let(
        {
          findUser: q.Select(
            ['data'],
            q.Map(
              q.Paginate(q.Match(q.Index('userByEmail'), email), { size: 1 }),
              q.Lambda('x', q.Get(q.Var('x')))
            ),
            []
          ),
          userExist: q.GT(q.Count(q.Var('findUser')), 0),
        },
        {
          userExist: q.Var("userExist"),
          user: q.If(
            q.Var('userExist'),
            {
              id: q.Select([0, "ref", "id"], q.Var('findUser'), undefined),
              firstName: q.Select([0, "data", "firstName"], q.Var('findUser'), undefined),
              lastName: q.Select([0, "data", "lastName"], q.Var('findUser'), undefined),
              email: q.Select([0, "data", "email"], q.Var('findUser'), undefined),
              phoneNumber: q.Select([0, "data", "phoneNumber"], q.Var('findUser'), undefined),
              password: q.Select([0, "data", "password"], q.Var('findUser'), undefined),
            },
            {}
          )
        }
      )
    );

    if(!userExist || user.password !== password){
      throw ({
        message: 'Incorrect username or password!',
        user: {}
      });
    }

    const token = jwt.sign({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
    }, process.env.JWT_SECRET_TOKEN, { expiresIn: "5h" });

    delete user.password;
    
    res.json({
      message: "User is logged in successfully!",
      user,
      token
    });
  } catch (error) {
    res.status(400).json(error);
  }
});

router.post('/auth/sign-up', async (req, res) => {
  try {
    const errors = {};
    const { firstName, lastName, email, password, phoneNumber } = req.body;

    if(validator.isEmpty(firstName || '')){
      errors.firstName = 'Field "firstName" is requied!';
    }

    if(validator.isEmpty(lastName || '')){
      errors.lastName = 'Field "lastName" is requied!';
    }

    if(!validator.isEmail(email || '')){
      errors.email = 'Field "email" is not valid email!';
    }

    if(!validator.isStrongPassword(password || '')){
      errors.password = 'Field "password" is not strong enough!';
    }

    if(validator.isEmpty(password || '')){
      errors.password = 'Field "password" is requied!';
    }

    if(!validator.isMobilePhone(phoneNumber || '')){
      errors.phoneNumber = 'Field "Phone number" is not valid!';
    }

    if(validator.isEmpty(phoneNumber || '')){
      errors.phoneNumber = 'Field "Phone number" is requied!';
    }

    if(Object.keys(errors).length){
      throw ({
        message: 'Payload fields validation error!',
        errors
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
                password,
                phoneNumber
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
              phoneNumber: q.Select(["data", "phoneNumber"], q.Var('createUser'), undefined),
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
      phoneNumber: user.phoneNumber,
    }, process.env.JWT_SECRET_TOKEN, { expiresIn: "5h" });

    res.json({
      message: "User is signed up successfully!",
      user,
      token
    });
  } catch (error) {
    res.status(400).json(error);
  }
})

router.get('/products', async (req, res) => {  
  try {
    const { data = [] } = await client.query(
      q.Let(
        {
          list: q.Map(
            q.Paginate(q.Documents(q.Collection('products')), { size: 99999 }),
            q.Lambda(x => q.Get(x))
          )
        },
        {
          data: q.Map(
            q.Select(["data"], q.Var("list"), []),
            q.Lambda(product => {
              return ({
                id: q.Select(["ref", "id"], product, undefined),
                name: q.Select(["data", "name"], product, undefined),
                deliveryTime: q.Select(["data", "deliveryTime"], product, undefined),
                minimalOrder: q.Select(["data", "minimalOrder"], product, undefined),
                image: q.Select(["data", "image"], product, undefined),
                tags: q.Select(["data", "tags"], product, []),
              })
            }
          ))
        }
      )
    );
    
    res.json({ data });
  } catch (error) {
    res.status(400).json(error);
  }
});

app.use('/api', router);
app.use('*', (_, res) => res.send(404));

module.exports.handler = serverless(app);