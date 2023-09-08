import mongoose from 'mongoose'
import config from 'config'
import logger from './logger'

export default class MongoConn {
    mongoConn: mongoose.Connection
    private static _instance: MongoConn

    constructor() {
        this.connectDB()
        this.mongoConn = mongoose.connection
    }

    public static get instance() {
        return this._instance || ( this._instance = new this() )
    }

    public async connectDB() {
        mongoose.set('strictQuery', false)
        mongoose.set('bufferCommands', true)

        try {
            await mongoose.connect(
                `${config.get('mongodb.url')}/${config.get('mongodb.database')}`,
                config.get('mongodb.options')
            )
            logger.info(`Connected to database ${config.get('mongodb.database')}`)
        } catch( err ) {
            return logger.error(`Error in database ${err}`)
        }
    }
}