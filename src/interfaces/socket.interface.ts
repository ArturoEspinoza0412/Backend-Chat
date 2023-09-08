import { Socket } from "socket.io";
import { IUser } from "./user.interface";

export default interface ISocket extends IUser {
    socket: Socket
}