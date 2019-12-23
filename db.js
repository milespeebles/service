import Rxdb from 'rxdb'
// import leveldown from 'leveldown'
import adapter from 'pouchdb-adapter-leveldb'
import server from 'rxdb/plugins/server'

Rxdb.plugin (server)
Rxdb.plugin (adapter)

const DB_PATH = '/Users/user/sync/db'

const options = {
  name: `${DB_PATH}/data`,
  adapter: 'leveldb',
}

const main = async () => {
  const db = await Rxdb.create (options)

  const { app, server } = db.server ({
    path: '/data',
    port: 8080,
    cors: false, // true
    startServer: true,
  })
}


main ()
