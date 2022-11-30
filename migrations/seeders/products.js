const mock = [
  // {
  //   id: "1",
  //   name: "Fiona Mclaren"
  // },
  // {
  //   id: "2",
  //   name: "Kate Dee"
  // },
  // {
  //   id: "3",
  //   name: "Marie Atkinson"
  // },
  // {
  //   id: "4",
  //   name: "Nick Hoffman"
  // }
];

async function faker({ q, client }, data) {
  try {
    const { id, ...props } = data;

    await client.query(
      q.Create(q.Ref(q.Collection("products"), id), {
        data: props
      })
    );
  } catch (err) {
    const { description = "Error create fake product." } = err || {};
    console.log("\x1b[33m", `${description} \t`, data);
  }
}

async function seeder(db_context) {
  const result = mock.map(async (eachData) => {
    await faker(db_context, eachData);
  });

  return Promise.all(result);
}

module.exports = { seed: seeder };
