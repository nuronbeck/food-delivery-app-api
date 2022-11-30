const usersSeeder = require("./seeders/users");
const categoriesSeeder = require("./seeders/categories");
const productsSeeder = require("./seeders/products");

async function seeder(db_context) {
  // Fake seeding database

  await usersSeeder.seed(db_context).then(() => {
    console.log("\x1b[32m", "Users seeding completed!");
  });

  await categoriesSeeder.seed(db_context).then(() => {
    console.log("\x1b[32m", "Categories seeding completed!");
  });

  await productsSeeder.seed(db_context).then(() => {
    console.log("\x1b[32m", "Products seeding completed!");
  });
}

module.exports = seeder;
