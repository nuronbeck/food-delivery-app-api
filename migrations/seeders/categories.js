const mock = [
  // {
  //   id: '1',
  //   name: 'Burgers'
  // },
  // {
  //   id: '2',
  //   name: 'Pizzas'
  // }
]

async function faker({ q, client }, data) {
  try {
    const { id, ...props } = data

    return await client.query(
      q.Create(q.Ref(q.Collection('categories'), id), {
        data: props
      })
    )
  } catch (err) {
    const { description = 'Error create fake category.' } = err || {}
    console.log('\x1b[33m', `${description} \t`, data)
  }
}

async function seeder(db_context) {
  const result = mock.map(async eachData => {
    await faker(db_context, eachData)
  })

  return await Promise.all(result)
}

module.exports = { seed: seeder }
