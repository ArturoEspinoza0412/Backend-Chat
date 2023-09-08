import { Server, Socket } from 'socket.io';
import logger from '../../lib/logger';
import { verify } from 'jsonwebtoken';
import config from 'config';
import ISocket from '../interfaces/socket.interface';

export default class SocketIO {
  private io: Server;
  private clients: ISocket[];

  constructor(server: Server) {
    this.clients = [];
    this.io = server;
    this.io.use((socket, next) => {
      const token = (socket.handshake.headers.authorization ? socket.handshake.headers.authorization : '')
      verify(token, config.get('jwt.accessTokenSecret'), (err: any, decoded: any) => {
        if (err) {
          const err = new Error("token error")
          socket.disconnect();
          return next(err);
        }

        decoded.user.socket = socket;
        const client: ISocket = decoded.user;

        const clientFound = this.getClientByEmail(client.email);

        if (clientFound) {
          const err = new Error("currently logged in user")
          socket.disconnect();
          return next(err);
        }

        this.clients.push(client);
        next();
      });
    });
    this.listenSockets();
  }

  private listenSockets() {
    this.io.on('connection', (client: Socket) => {
      const clientFound = this.getDataClient(client.id);

      if (clientFound) {
        logger.info(`El cliente ${clientFound.email} se ha conectado`);
      }

      client.emit('clientOnline', { clients: this.clients.length });
      client.on('message', (message: string) => {
        if (clientFound) {
          this.io.emit('newMessage', {
            email: clientFound.email,
            message: message,
          });
        }
      });

      this.clientWriting(client.id); 

      this.disconnectClient(clientFound);
      
      this.receiveMessage(client); 
    });
  }

  private getDataClient(socketId: string): ISocket | undefined {
    const clientFound = this.clients.find((client) => client.socket.id === socketId);
    return clientFound;
  }

  private getClientByEmail(email: string): ISocket | undefined { 
    return this.clients.find((client) => client.email === email);
  }

  private removeClientFromList(socketId: string) {
    const index = this.clients.findIndex((client) => client.socket.id === socketId);
    if (index !== -1) {
      this.clients.splice(index, 1);
    }
  }

  private disconnectClient(client: ISocket | undefined) { 
    if (client) {
      client.socket.on('disconnect', () => {
        this.removeClientFromList(client.socket.id);
        logger.info(`El cliente ${client.email} se fue`);
      });
    }
  }

  private clientWriting(socketId: string) { 
    this.io.on('clientWriting', () => {
      const client = this.getDataClient(socketId);
      if (client) { 
        this.io.emit('clientWriting', {
          email: client.email,
        });
      }
    });
  }

  private receiveMessage(client: Socket) { 
    client.on('sendMessage', (message: string) => {
      const clientData = this.getDataClient(client.id);
      if (clientData) {
        //this.io.emit('receiveMessage', { 
          client.broadcast.emit('receiveMessage', { 
          sender: clientData.email,
          message: message,
        });
      }
    });
  }
}
