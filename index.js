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
import memory from 'pouchdb-adapter-memory'
import http from 'pouchdb-adapter-http'
import Express from 'express'
import Socket from 'socket.io'
// import mergeDeepRight from 'ramda/src/mergeDeepRight'

Rxdb.plugin (memory)
Rxdb.plugin (http)

// const DEFAULT_CONFIG = {
//   dbPath: '/db',
// }

const Service = async func => {
  const { type } = func

  // const { dbPath } = mergeDeepRight (DEFAULT_CONFIG, config)

  // express
  const port = process.env.PORT || 3000
  const app = Express ()
  const server = app.listen (port)

  // socket.io
  const io = Socket (server)

  // data
  const options = {
    // name: `leveldb://${dbPath}/data`,
    // name: 'http://127.0.0.1:8080/data',
    name: 'db',
    adapter: 'memory',
  }

  const db = await Rxdb.create (options)

  // api
  const Collection = async (name, schema) => {
    const existing = db[name]
    let collection

    if (db[name]) {
      collection = existing
    } else {
      collection = await db.collection ({
        name,
        schema,
      })

      const sync = collection.sync ({
        remote: 'http://127.0.0.1:8080/db',
        waitForLeadership: false,
        direction: {
          pull: true,
          push: true,
        },
        options: {
          live: true,
          retry: true,
        },
      })

      sync.error$.subscribe (i => console.log ('error: ', i))
      sync.change$.subscribe (i => console.log ('change: ', i))
      sync.docs$.subscribe (i => console.log ('docs: ', i))
      sync.denied$.subscribe (i => console.log ('denied: ', i))
      sync.active$.subscribe (i => console.log ('active: ', i))
      sync.alive$.subscribe (i => console.log ('alive: ', i))
      sync.complete$.subscribe (i => console.log ('complete: ', i))
    }

    return collection
  }

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

