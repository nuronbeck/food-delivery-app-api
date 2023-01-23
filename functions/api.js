require('dotenv').config({ path: '../.env' })
const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const bodyParser = require('body-parser');
// const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const validator = require('validator');

const sendEmail = require('../utils/sendEmail');

// const axios = require("axios");
// const fs = require("fs");
// const mustache = require('mustache');

const faunadb = require('faunadb');
const q = faunadb.query;

// Instantiate a client
const client = new faunadb.Client({
  secret: process.env.FAUNA_API_KEY,
  domain: process.env.FAUNA_DOMAIN,
  port: 443,
  scheme: 'https',
});

// Mailer API settings
// const SINB_API_KEY = process.env.SINB_API_KEY;
// const API_EMAIL_BASE_URL = "https://api.sendinblue.com";
// const RECEPTION_EMAIL = process.env.CONTACT_EMAIL;
// const FROM_NAME = process.env.MAILER_NAME;
// const FROM_EMAIL = process.env.MAILER_EMAIL;

// const MAILER_API_SERVICE = axios.create({
//   baseURL: API_EMAIL_BASE_URL,
//   headers: {
//     'Accept': 'application/json',
//     'Content-Type': 'application/json',
//     'api-key': SINB_API_KEY
//   }
// });

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
router.post('/auth', authMiddleware, async (req, res) => {
  try {
    const { user: { email } } = req;

    const { user } = await client.query(
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
        },
        {
          user: {
            id: q.Select([0, "ref", "id"], q.Var('findUser'), undefined),
            firstName: q.Select([0, "data", "firstName"], q.Var('findUser'), undefined),
            lastName: q.Select([0, "data", "lastName"], q.Var('findUser'), undefined),
            email: q.Select([0, "data", "email"], q.Var('findUser'), undefined),
            phoneNumber: q.Select([0, "data", "phoneNumber"], q.Var('findUser'), undefined),
            password: q.Select([0, "data", "password"], q.Var('findUser'), undefined),
            isVerified: q.Select([0, "data", "isVerified"], q.Var('findUser'), false),
          },
        }
      )
    );

    const token = jwt.sign({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      isVerified: user.isVerified,
    }, process.env.JWT_SECRET_TOKEN, { expiresIn: "5h" });

    delete user.password;

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
              isVerified: q.Select([0, "data", "isVerified"], q.Var('findUser'), false),
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
                phoneNumber,
                isVerified: false
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
              isVerified: q.Select(["data", "isVerified"], q.Var('createUser'), false),
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
      isVerified: user.isVerified,
    }, process.env.JWT_SECRET_TOKEN, { expiresIn: "5h" });

    // try {
    //   const templateHtml = fs.readFileSync(require.resolve('./validate-email-template.html'), 'utf8');
    //   const emailHtml = mustache.render(templateHtml, {
    //     name: user.name,
    //     email: user.email
    //   });
  
    //   await MAILER_API_SERVICE.post(`/v3/smtp/email`, {
    //     sender: {
    //       name: FROM_NAME,
    //       email: FROM_EMAIL
    //     },
    //     to: [{
    //       email: user.email,
    //     }],
    //     subject: 'Food delivery app | Verify your email',
    //     htmlContent: emailHtml
    //   });
    // } catch (error) {
    //   console.log(error);
    // }

    try {
      await sendEmail({ name: "Nurbek", email: "nuronbeck@gmail.com" });
    } catch (errorMailing) {
      console.log('errorMailing => ', errorMailing);
    }

    res.json({
      message: "User is signed up successfully!",
      user,
      token
    });
  } catch (error) {
    res.status(400).json(error);
  }
})

router.post('/auth/password-change', authMiddleware, async (req, res) => {
  try {
    const { user: { iat, exp, ...user } } = req;

    const errors = {};
    const { password } = req.body;

    if(!validator.isStrongPassword(password || '')){
      errors.password = 'Field "password" is not strong enough!';
    }

    if(validator.isEmpty(password || '')){
      errors.password = 'Field "password" is requied!';
    }

    if(Object.keys(errors).length){
      throw ({
        message: 'Payload fields validation error!',
        errors
      })
    }

    const { userExist, updatedUser } = await client.query(
      q.Let(
        {
          userById: q.Select(["ref", "id"], q.Get(
            q.Ref(
              q.Collection('users'),
              user.id
            )
          ), undefined),

          userExist: q.IsString(q.Var("userById")),

          updatedUser: 
          q.If(
            q.Var('userExist'),
            q.Update(
              q.Ref(q.Collection('users'), q.Var("userById")),
              {
                data: {
                  password
                }
              }
            ),
            {}
          )
        },
        {
          userExist: q.Var('userExist'),
          updatedUser: q.If(
            q.Var('userExist'),
            {
              id: q.Select(["ref", "id"], q.Var('updatedUser'), undefined),
              firstName: q.Select(["data", "firstName"], q.Var('updatedUser'), undefined),
              lastName: q.Select(["data", "lastName"], q.Var('updatedUser'), undefined),
              email: q.Select(["data", "email"], q.Var('updatedUser'), undefined),
              phoneNumber: q.Select(["data", "phoneNumber"], q.Var('updatedUser'), undefined),
              isVerified: q.Select(["data", "isVerified"], q.Var('updatedUser'), false),
            },
            {}
          )
        }
      )
    );

    if(!userExist){
      throw ({
        message: 'User is not exist!',
        user
      })
    }

    const token = jwt.sign({
      id: updatedUser.id,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      phoneNumber: updatedUser.phoneNumber,
    }, process.env.JWT_SECRET_TOKEN, { expiresIn: "5h" });

    res.json({
      user: updatedUser,
      token
    });
  } catch (error) {
    res.status(400).json(error);
  }
});

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
                categories: q.Select(
                  ['data'],
                  q.Map(
                    q.Paginate(q.Match(q.Index('productCategories'), q.Select(["ref", "id"], product, undefined)), { size: 99999 }),
                    q.Lambda(
                      'x',
                      q.Let(
                        {
                          category: q.Get(
                            q.Ref(
                              q.Collection('categories'),
                              q.Select(["data", "category_id"], q.Get(q.Var('x')))
                            )
                          )
                        },
                        {
                          id: q.Select(["ref", "id"], q.Var("category"), undefined),
                          name: q.Select(["data", "name"], q.Var("category"), undefined),
                          image: q.Select(["data", "image"], q.Var("category"), undefined),
                        }
                      )
                    )
                  ),
                  []
                ),
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

router.get('/categories', async (_, res) => {  
  try {
    const { data = [] } = await client.query(
      q.Let(
        {
          list: q.Map(
            q.Paginate(q.Documents(q.Collection('categories')), { size: 99999 }),
            q.Lambda(x => q.Get(x))
          )
        },
        {
          data: q.Map(
            q.Select(["data"], q.Var("list"), []),
            q.Lambda(category => {
              return ({
                id: q.Select(["ref", "id"], category, undefined),
                name: q.Select(["data", "name"], category, undefined),
                image: q.Select(["data", "image"], category, undefined),
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
app.use('*', (_, res) => res.sendStatus(404));

module.exports.handler = serverless(app);