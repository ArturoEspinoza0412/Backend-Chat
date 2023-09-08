import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import config from 'config'

export default class AdEncrypClass {
    private genRandomString(length: number ) {
        return crypto.randomBytes(Math.ceil(length / 2))
        .toString('hex')
        .slice(0, length)
    }

    private getStringValue(data: { toString: () => any; }) {
        if (typeof data === 'number' || data instanceof Number) {
            return data.toString();
        }
    
        if (!Buffer.isBuffer(data) && typeof data !== 'string') {
            throw new TypeError('Los datos para generar contraseñas deber ser de tipo String o Buffer');
        }
    
        return data;
    }

    private sha512(password: string, salt: string) {
        const hash = crypto.createHmac('sha512', this.getStringValue(salt))
        hash.update(this.getStringValue(password))
        const passwordHash = hash.digest('hex')
    
        return {
            salt,
            passwordHash
        }
    }

    public genPassword(password: String) {
        const salt = this.genRandomString(16)
        return this.sha512(String(password), salt)
    }

    public genResetPasswordToken(userId: any) {
        const text = JSON.stringify({ userId, valid: new Date().getTime() + `${config.get("crypto.auth_ttl")}` });
    
        const cipher = crypto.createCipher(config.get("crypto.auth_algorithm"), config.get("crypto.auth_secret"));
        let ciphered = cipher.update(text, config.get("crypto.auth_inputEncoding"), config.get("crypto.auth_outputEncoding"));
        ciphered += cipher.final(config.get("crypto.auth_outputEncoding"));
    
        return ciphered;
    }

    public saltHashPassword(password: string, salt: string ) {
        return this.sha512(String(password), salt);
    }

    public genToken( user: any ): Promise<any> {
        return new Promise((resolve, reject) => {
            const payload = {
                user
            }
    
            const privateKey: string = config.get('jwt.accessTokenSecret')
            const tokenLife: number = config.get('jwt.accessTokenLife')
    
            jwt.sign(payload, privateKey, {
                expiresIn: tokenLife,
                algorithm: 'HS256'
            }, (err, token) => {
                if (err) {
                    return reject(err)
                } else {
                    return resolve(token)
                }
            });
        })
    }
}