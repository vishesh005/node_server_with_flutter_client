import * as express from 'express';
import {LoginApiValidator} from "../validators/login.api.validator";
import {Api_failure, Api_success} from "../models/api_models";
import {getCryptoSigning, SigningType} from "../encryption/crypto.signing";
import {Dao_provider} from '../db/dao_provider';
import {DatabaseFactory, DatabaseType} from "../db/database";

import {User, UserWithAuth} from "../models/user_models";

const  userDao = Dao_provider.getInstance().userDao;

const loginRouter = express.Router();


loginRouter.post('/', async function(req :any ,res: any){
   const validationErrorMessage = LoginApiValidator.validateLoginGetRequest(req.body)
   try {
       if (validationErrorMessage != undefined) {
           res.status(400).send(new Api_failure("Invalid Request params", validationErrorMessage, ""))
       } else {
            const dbUser = await userDao.findUserWithPassword(req.body.email);
            if(dbUser == undefined){
                res.send(new Api_failure("Invalid User",{},"User email doesn't exists"))
            }
            const cyptoSigning = getCryptoSigning(SigningType.JWT);
            if(!cyptoSigning.matchHashedValue(req.body.password, dbUser.password)){
                res.send(new Api_failure("Invalid Credentials",{},"User credentials are invalid"))
            }

            const authToken = cyptoSigning.generateAuthToken({
                "user": dbUser},process.env.CLIENT_SECRET);
            await userDao.createUserSession(new UserWithAuth(dbUser.email,dbUser.name,authToken))

           res.
            header("auth-token", authToken).
            send(new Api_success(`${dbUser.email} has been successfully loggedIn`, {
                "userDetails": User.fromResponse(dbUser),
                "loggedInTime": new Date(),
            }))
       }
   }catch (e) {
       res.status(500).send(new Api_failure("Something went wrong",{},"Some error has occurred"))
   }
});


module.exports = loginRouter
