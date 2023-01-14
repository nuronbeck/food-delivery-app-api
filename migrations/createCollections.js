async function createCollections({ q, client }) {
  const users = await client
    .query(q.CreateCollection({ name: 'users' }))
    .then(() => successLogger('users'))
    .catch(err => errorLogger('users', err?.description))

  const categories = await client
    .query(q.CreateCollection({ name: 'categories' }))
    .then(() => successLogger('categories'))
    .catch(err => errorLogger('categories', err?.description))

  const products = await client
    .query(q.CreateCollection({ name: 'products' }))
    .then(() => successLogger('products'))
    .catch(err => errorLogger('products', err?.description))
    
  const productCategories = await client
    .query(q.CreateCollection({ name: 'product_categories' }))
    .then(() => successLogger('product_categories'))
    .catch(err => errorLogger('product_categories', err?.description))

  return await Promise.all([ users, categories, products, productCategories ])
}

function successLogger(entity = '') {
  console.log('\x1b[32m', `Collection "${entity}" was created successfully!`)
}

function errorLogger(entity = '', error) {
  console.log('\x1b[33m', `Collection "${entity}" Error: ${error}`)
}

module.exports = createCollections
