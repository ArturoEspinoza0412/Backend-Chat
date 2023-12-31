import User from "../models/user.model";
import { IUser } from "../interfaces/user.interface";
import AdEncrypClass from "../class/adencrypt";
import IResponse from "../interfaces/response.interface";

export default class UserController {
  private encrypt = new AdEncrypClass();
  private activeSessions: Record<string, string> = {};

  createUser(user: IUser): Promise<IResponse> {
    return new Promise((resolve, reject) => {
      (async () => {
        try {
          if (user.password) {
            const { salt, passwordHash } = this.encrypt.genPassword(
              user.password
            );
            user.password = passwordHash;
            user.salt = salt;
          } else {
            return reject({
              ok: false,
              message: "bad request",
              response: null,
              code: 400,
            });
          }

          const userCreated = await User.create(user);
          let userSended = userCreated;
          userSended.password = "";
          userSended.salt = "";

          return resolve({
            ok: true,
            message: "user created",
            response: userSended,
            code: 201,
          });
        } catch (err: any) {
          return reject({
            ok: false,
            message: "error ocurred",
            response: err,
            code: 500,
          });
        }
      })();
    });
  }

  getUsers(): Promise<IResponse> {
    return new Promise((resolve, reject) => {
      (async () => {
        try {
          const usersDB = await User.find({});
          if (usersDB.length < 1) {
            return reject({
              ok: false,
              message: "dont have users",
              response: null,
              code: 404,
            });
          }

          const response = {
            users: usersDB,
            total: usersDB.length,
          };

          return resolve({
            ok: true,
            message: "users recovered",
            response: response,
            code: 200,
          });
        } catch (err: any) {
          return reject({
            ok: false,
            message: "error ocurred",
            response: err,
            code: 500,
          });
        }
      })();
    });
  }

  updateUserByEmail(user: IUser): Promise<IResponse> {
    return new Promise((resolve, reject) => {
      (async () => {
        try {
          const userUpdated = await User.findOneAndUpdate(
            { email: user.email },
            user,
            { returnDocument: "after", select: "-salt -password" }
          );
          if (!userUpdated) {
            return reject({
              ok: false,
              message: "user dont found",
              response: null,
              code: 404,
            });
          }

          return resolve({
            ok: true,
            message: "user updated",
            response: userUpdated,
            code: 200,
          });
        } catch (err: any) {
          return reject({
            ok: false,
            message: "server error",
            response: err,
            code: 500,
          });
        }
      })();
    });
  }

  deleteUserByID(id: string): Promise<IResponse> {
    return new Promise((resolve, reject) => {
      (async () => {
        try {
          const userDeleted = await User.findByIdAndDelete(id, {
            select: "-salt -password",
          });

          if (!userDeleted) {
            return reject({
              ok: false,
              message: `user with id ${id} dont exist`,
              response: null,
              code: 404,
            });
          }

          return resolve({
            ok: true,
            message: "user deleted",
            response: userDeleted,
            code: 200,
          });
        } catch (err: any) {
          return reject({
            ok: false,
            message: "server error",
            response: err,
            code: 500,
          });
        }
      })();
    });
  }

  searchUserByEmail(email: string): Promise<IResponse> {
    return new Promise((resolve, reject) => {
      (async () => {
        try {
          const userFinded = await User.findOne({ email: email }).select(
            "name lastname email"
          );

          if (!userFinded) {
            return reject({
              ok: false,
              message: "user dont exist",
              response: null,
              code: 404,
            });
          }

          return resolve({
            ok: true,
            message: "user found",
            response: userFinded,
            code: 200,
          });
        } catch (err: any) {
          return reject({
            ok: false,
            message: "server error",
            response: err,
            code: 500,
          });
        }
      })(); // IIFE Immendiately Invoked Function Expression
    });
  }

  loginUser(email: string, password: string): Promise<IResponse> {
    return new Promise((resolve, reject) => {
      (async () => {
        try {
          const userFinded = await User.findOne({ email: email });

          if (userFinded) {
            const { passwordHash } = this.encrypt.saltHashPassword(
              password,
              userFinded.salt
            );

            if (passwordHash === userFinded.password) {
              if (this.activeSessions[email]) {
                return reject({
                  ok: false,
                  message: "you are already logged in",
                  response: null,
                  code: 401,
                });
              }

              let userToken = this.removeSensiteveData(userFinded);
              const token = await this.encrypt.genToken(userToken);

              this.activeSessions[email] = token;

              return resolve({
                ok: true,
                message: "login successfull",
                response: null,
                code: 200,
                token: token,
              });
            } else {
              return reject({
                ok: false,
                message: "bad request",
                response: null,
                code: 401,
              });
            }
          } else {
            return reject({
              ok: false,
              message: "user doesnt exist",
              response: null,
              code: 404,
            });
          }
        } catch (err: any) {
          return reject({
            ok: false,
            message: "bad request",
            response: err,
            code: 500,
          });
        }
      })();
    });
  }

  logoutUser(email: string): void {
    delete this.activeSessions[email];
  }

  async changePassword(
    userEmail: string,
    oldPassword: string,
    newPassword: string
  ): Promise<IResponse> {
    return new Promise(async (resolve, reject) => {
      try {
        const userFinded = await User.findOne({ email: userEmail });

        if (userFinded) {
          const { passwordHash } = this.encrypt.saltHashPassword(
            oldPassword,
            userFinded.salt
          );

          if (passwordHash === userFinded.password) {
            const { salt, passwordHash: newHash } =
              this.encrypt.genPassword(newPassword);

            const userUpdated = await User.findOneAndUpdate(
              { email: userEmail },
              { password: newHash, salt: salt },
              { returnDocument: "after", select: "-salt -password" }
            );

            if (!userUpdated) {
              return reject({
                ok: false,
                message: "User not found or password not updated",
                response: null,
                code: 500,
              });
            }

            return resolve({
              ok: true,
              message: "Password updated successfully",
              response: null,
              code: 200,
            });
          } else {
            return reject({
              ok: false,
              message: "Old password is incorrect",
              response: null,
              code: 401,
            });
          }
        } else {
          return reject({
            ok: false,
            message: "User doesn't exist",
            response: null,
            code: 404,
          });
        }
      } catch (err: any) {
        return reject({
          ok: false,
          message: "Server error",
          response: err,
          code: 500,
        });
      }
    });
  }
  generateRandomPassword(length: number): Promise<IResponse> {
    return new Promise((resolve, reject) => {
      try {
        const randomPassword = this.generateRandomString(length);
        const { salt, passwordHash } = this.encrypt.genPassword(randomPassword);

        return resolve({
          ok: true,
          message: "random password generated",
          response: { password: randomPassword, passwordHash, salt },
          code: 200,
        });
      } catch (err) {
        return reject({
          ok: false,
          message: "error occurred while generating random password",
          response: err,
          code: 500,
        });
      }
    });
  }

  private generateRandomString(length: number): string {
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";

    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      result += characters.charAt(randomIndex);
    }

    return result;
  }

  private removeSensiteveData(user: any) {
    let objUser = user.toObject();
    delete objUser.password;
    delete objUser.salt;

    return objUser;
  }
}
