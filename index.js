// ## stack
// docker (containers)
// rxdb (database)
// socket.io (websocket)
// dat (distributed)
// ramda (fp)
// crocks (adt)

// https://home.os
// https://db.home.os
// https://admin.home.os
// https://notes.home.os
// https://media.home.os
// https://gallery.home.os
// https://social.home.os
// https://chat.social.home.os
// https://boards.social.home.os
// https://micro.social.home.os
// https://airsonic.home.os
// https://mpd.home.os

import Rxdb from 'rxdb'
import leveldown from 'leveldown'
import adapter from 'pouchdb-adapter-leveldb'
import Express from 'express'
import Socket from 'socket.io'
import mergeDeepRight from 'ramda/src/mergeDeepRight'

Rxdb.plugin (adapter)

const DEFAULT_CONFIG = {
  dbPath: '/db',
}

const Service = async (func, config = {}) => {
  const { type } = func

  const { dbPath } = mergeDeepRight (DEFAULT_CONFIG, config)

  // express
  const port = process.env.PORT || 3000
  const app = Express ()
  const server = app.listen (port)

  // socket.io
  const io = Socket (server)

  // data
  const options = {
    name: `leveldb://${dbPath}/data`,
    adapter: leveldown,
  }

  const db = await Rxdb.create (options)

  // api
  const Collection = (name, schema) =>
    db[name] || db.collection ({
      name,
      schema,
    })

  const api = {
    Collection,
    db,
    io,
  }

  // handlers
  if (type === 'request') {
    const { callback } = func

    app.use ('/', (req, res) => callback ({ req, res, ...api }))
  }

  if (type === 'socket') {
    const { callback } = func

    io.on ('connection', socket => callback ({ socket, ...api }))
  }

  if (type === 'process') {
    const { callback } = func

    callback (api)
  }
}

export default Service

