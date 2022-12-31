const mock = [
  // {
  //   id: '1',
  //   email: 'roman@avaloninnovations.com.au',
  //   firstName: 'Roman',
  //   lastName: 'Yakobnyuk'
  // },
  // {
  //   id: '2',
  //   email: 'grigoriev.alex.97@gmail.com',
  //   firstName: 'Alexander',
  //   lastName: 'Grigoriev'
  // },
]

async function faker({ q, client }, data) {
  try {
    const { id, ...props } = data

    return await client.query(
      q.Create(q.Ref(q.Collection('users'), id), {
        data: props
      })
    )
  } catch (err) {
    const { description = 'Error create fake user.' } = err || {}
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
