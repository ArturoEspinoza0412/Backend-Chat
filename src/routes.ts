import { Router, Request, Response } from "express";
import UserController from "./controllers/user.controller";


const authRoutes = Router();
const userCtrl = new UserController();

authRoutes.get("/getUsers", async (req: Request, res: Response) => {
  try {
    const response = await userCtrl.getUsers();
    return res.status(response.code).json(response);
  } catch (err: any) {
    return res.status(err.code ? err.code : 500).json(err);
  }
});

authRoutes.post("/create", async (req: Request, res: Response) => {
  const { user } = req.body;

  try {
    const response = await userCtrl.createUser(user);
    return res.status(response.code).json(response);
  } catch (err: any) {
    return res.status(err.code ? err.code : 500).json(err);
  }
});

authRoutes.put("/update", async (req: Request, res: Response) => {
  const { email } = req.body.user;
  const updateData = req.body;

  try {
    const response = await userCtrl.updateUserByEmail(email);
    return res.status(response.code).json(response);
  } catch (err: any) {
    return res.status(err.code ? err.code : 500).json(err);
  }
});

authRoutes.delete("/delete/:id", async (req: Request, res: Response) => {
  const userId: string = req.params.id;
  console.log(userId);
  try {
    const response = await userCtrl.deleteUserByID(userId);
    return res.status(response.code).json(response);
  } catch (err: any) {
    return res.status(err.code ? err.code : 500).json(err);
  }
});

authRoutes.get("/getuserbyemail/:email", async (req: Request, res: Response) =>{
  const {email} = req.params;
  try{
    const response = await userCtrl.searchUserByEmail(email);
    return res.status(response.code).json(response);
  } catch(err: any){
    return res.status(err.code ? err.code : 500).json(err)
  }
})

authRoutes.post('/login', async(req: Request, res: Response) => {
  const { email, password } = req.body
  try{
    const response = await userCtrl.loginUser(email, password)
    return res.status( response.code).json(response)
  }catch (err:any){
    return res.status(err.code ? err.code : 500).json(err)
  }
})

authRoutes.post('/logout', async (req: Request, res: Response) => {
  const { email } = req.body
  try {
    userCtrl.logoutUser(email)
    return res.json({ message: 'Logged out successfully' })
  } catch (err: any) {
    return res.status(err.code ? err.code : 500).json(err)
  }
})

authRoutes.put("/changePassword", async (req: Request, res: Response) => {
  const { email, oldPassword, newPassword } = req.body;

  try {
    const response = await userCtrl.changePassword(email, oldPassword, newPassword);
    return res.status(response.code).json(response);
  } catch (err: any) {
    return res.status(err.code ? err.code : 500).json(err);
  }
})

export default authRoutes;
