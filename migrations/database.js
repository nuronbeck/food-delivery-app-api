require('dotenv').config()
const { query: q, Client: dbClient } = require('faunadb')

const client = new dbClient({
  secret: process.env.FAUNA_API_KEY,
  domain: process.env.FAUNA_DOMAIN,
  port: 443,
  scheme: 'https'
})

module.exports = { q, client }
