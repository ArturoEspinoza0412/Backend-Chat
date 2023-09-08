import http from 'http'
import express from 'express'
import config from 'config'
import MongoConn from '../../lib/mongodb'
import logger from '../../lib/logger'
import { Server } from 'socket.io'
import SocketIO from '../controllers/sockets.controller';

export default class HttpServer {
    private port: number
    private httpServer: http.Server
    private static _instance: HttpServer
    private mongodb: MongoConn
    private io: Server
    public ioServer: SocketIO
    public app: express.Application

    constructor() {
        this.port = config.get('api.port')
        this.app = express()
        this.httpServer = new http.Server(this.app)
        this.io = new Server(this.httpServer, { cors: { origin: '*' }})
        this.mongodb = MongoConn.instance
        this.ioServer = new SocketIO(this.io)
    }

    public static get instance() {
        return this._instance || ( this._instance = new this() )
    }

    async start() {
        try {
            await this.httpServer.listen(this.port)
            logger.info(`Server run on port: ${ this.port }`)
        } catch( err ) {
            logger.error(`Error: ${ err }`)
        }
    }
}