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

  const productCategoriesIndex = await client
    .query(
      q.CreateIndex({
        name: 'productCategories',
        source: q.Collection('product_categories'),
        terms: [{ field: ['data', 'product_id'] }],
      })
    )
    .then(() => successLogger('productCategories'))
    .catch(err => errorLogger('productCategories', err?.description))

  const categoryProductsIndex = await client
    .query(
      q.CreateIndex({
        name: 'categoryProducts',
        source: q.Collection('product_categories'),
        terms: [{ field: ['data', 'category_id'] }],
      })
    )
    .then(() => successLogger('categoryProducts'))
    .catch(err => errorLogger('categoryProducts', err?.description))

  return await Promise.all([
    // Users collection indexes
    allUsersIndex,
    userByEmailIndex,

    // Categories collection indexes
    allCategoriesIndex,

    // Products collection indexes
    allProductsIndex,

    // ProductCategories collection indexes
    productCategoriesIndex,
    categoryProductsIndex
  ])
}

function successLogger(entity = '') {
  console.log('\x1b[32m', `Index "${entity}" was created successfully!`)
}

function errorLogger(entity = '', error) {
  console.log('\x1b[33m', `Index "${entity}" Error: ${error}`)
}

module.exports = createIndexes
