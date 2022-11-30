const createCollections = require("./createCollections");
const createIndexes = require("./createIndexes");

async function migrate(db_context) {
  console.log("\x1b[33m", "Initial migration is started...");

  // Creating collections
  const initCollections = await createCollections(db_context);

  // Creating indexes for collections
  const initIndexes = await createIndexes(db_context);

  return await Promise.all([ initCollections, initIndexes ]);
}

module.exports = migrate;
