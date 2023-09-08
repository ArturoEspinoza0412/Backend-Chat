export default interface IResponse {
    ok: boolean
    message: string
    response: any
    code: number
    token?: string
}