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
import multer from 'multer'
// import Socket from 'socket.io'
import mergeDeepRight from 'ramda/src/mergeDeepRight'

// constants
const DEFAULT_CONFIG = {
  remote: 'http://localhost:8080/db',
}

// rxdb
Rxdb.plugin (memory)
Rxdb.plugin (http)

// multer
const storage = multer.memoryStorage ()
const fileUpload = multer ({ storage })

// service
const Service = async (func, config = {}) => {
  const { type, collections = [] } = func

  const { remote } = mergeDeepRight (DEFAULT_CONFIG, config)

  // express
  const port = process.env.PORT || 3000
  const app = Express ()
  const server = app.listen (port)
  const upload = fileUpload.single ('data')

  app.use (Express.json ())

  // socket.io
  // const io = Socket (server)

  // data
  const options = {
    name: 'db',
    adapter: 'memory',
  }

  const db = await Rxdb.create (options)

  const states = await Promise.all (
    collections.map (async ({ name, schema }) => {
      const collection = await db.collection ({
        name,
        schema,
      })

      collection.sync ({
        remote,
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

      await collection
        .find ()
        .exec ()

      return { name, collection }
    })
  )

  const state = states.reduce (
    (accumulator, { name, collection }) => {
      accumulator[name] = collection

      return accumulator
    },
    {},
  )

  // api
  const api = {
    // io,
    db,
    upload,
    state,
  }

  // handlers
  if (type === 'request') {
    const { callback } = func

    app.use ('/', (req, res) => callback ({ req, res, ...api }))
  }

  // if (type === 'socket') {
  //   const { callback } = func

  //   io.on ('connection', socket => callback ({ socket, ...api }))
  // }

  if (type === 'process') {
    const { callback } = func

    callback (api)
  }
}

export default Service

