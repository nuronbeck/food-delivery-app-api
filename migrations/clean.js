async function getIndexes({ q, client }) {
  try {
    const dbAllIndexes = await client.query(
      q.Map(
        q.Select("data", q.Paginate(q.Indexes(), { size: 9999 })),
        q.Lambda("indexData", q.Select("name", q.Get(q.Var("indexData")), null))
      )
    );

    return dbAllIndexes;
  } catch (err) {
    const { description = "Indexes could not be loaded!" } = err || {};
    console.log("\x1b[33m", `${description} \t`);

    return [];
  }
}

async function removeIndexes({ q, client }, indexesArr = []) {
  try {
    const dbAllIndexes = indexesArr.forEach(
      async (eachIndex) => await client.query(q.Delete(q.Index(eachIndex)))
    );

    console.log("\x1b[32m", "All indexes has been deleted!");
    return await dbAllIndexes;
  } catch (err) {
    const { description = "Indexes could not be deleted!" } = err || {};
    console.log("\x1b[33m", `${description} \t`);

    return [];
  }
}

async function getCollections({ q, client }) {
  try {
    const dbAllCollections = await client.query(
      q.Map(
        q.Select("data", q.Paginate(q.Collections(), { size: 9999 })),
        q.Lambda(
          "collectionData",
          q.Select("name", q.Get(q.Var("collectionData")), null)
        )
      )
    );

    return dbAllCollections;
  } catch (err) {
    const { description = "Collections could not be loaded!" } = err || {};
    console.log("\x1b[33m", `${description} \t`);

    return [];
  }
}

async function removeCollections({ q, client }, collectionsArr = []) {
  try {
    const dbAllCollections = collectionsArr.forEach(
      async (eachCollection) =>
        await client.query(q.Delete(q.Collection(eachCollection)))
    );

    console.log("\x1b[32m", "All collections has been deleted!");
    return await dbAllCollections;
  } catch (err) {
    const { description = "Collections could not be deleted!" } = err || {};
    console.log("\x1b[33m", `${description} \t`);

    return [];
  }
}

async function clean(db_context) {
  // Array of database index names
  const dbIndexes = await getIndexes(db_context);
  await removeIndexes(db_context, dbIndexes);

  // Array of database collection names
  const dbCollections = await getCollections(db_context);
  await removeCollections(db_context, dbCollections);
}

module.exports = clean;
