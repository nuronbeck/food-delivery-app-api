async function createIndexes({ q, client }) {
  // Users collection indexes
  const allUsersIndex = await client
    .query(
      q.CreateIndex({
        name: 'allUsers',
        source: q.Collection('users')
      })
    )
    .then(() => successLogger('allUsers'))
    .catch(err => errorLogger('allUsers', err?.description))

  const userByEmailIndex = await client
    .query(
      q.CreateIndex({
        name: 'userByEmail',
        source: q.Collection('users'),
        terms: [{ field: ['data', 'email'] }],
        unique: true,
        partitions: 1
      })
    )
    .then(() => successLogger('userByEmail'))
    .catch(err => errorLogger('userByEmail', err?.description))
  
  // Categories collection indexes
  const allCategoriesIndex = await client
    .query(
      q.CreateIndex({
        name: 'allCategories',
        source: q.Collection('categories')
      })
    )
    .then(() => successLogger('allCategories'))
    .catch(err => errorLogger('allCategories', err?.description))
  
  // Products collection indexes
  const allProductsIndex = await client
    .query(
      q.CreateIndex({
        name: 'allProducts',
        source: q.Collection('products')
      })
    )
    .then(() => successLogger('allProducts'))
    .catch(err => errorLogger('allProducts', err?.description))

  return await Promise.all([
    // Users collection indexes
    allUsersIndex,
    userByEmailIndex,

    // Categories collection indexes
    allCategoriesIndex,

    // Products collection indexes
    allProductsIndex
  ])
}

function successLogger(entity = '') {
  console.log('\x1b[32m', `Index "${entity}" was created successfully!`)
}

function errorLogger(entity = '', error) {
  console.log('\x1b[33m', `Index "${entity}" Error: ${error}`)
}

module.exports = createIndexes
