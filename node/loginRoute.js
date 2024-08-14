"use strict";

import { Router } from 'express';
import { Session } from './session.js';
import { findUserByName } from './user.js';

const expTime = process.env.REDIS_EXPIRE; // Expiration time for sessions

export default (redisClient) => 
{
    let router = Router();
    
    // If a post request to login comes in that means someone is trying to login
    router.post('', async (req, res) => 
    {
        var userCheck = await findUserByName(req.body.username);

        // Check if username was valid first as that's first priority
        if(userCheck === null)
        {
            res.sendStatus(400);
            return;
        }

        // Then check if password matched as second priority, if both these pass then request is valid
        if(userCheck.password !== req.body.password)
        {
            res.sendStatus(403);
            return;
        }

        let sessionLookup = await redisClient.get(`sessionsIdsByUserId:${userCheck.id}`).catch((err)=> {
            res.sendStatus(500);
        });

        if(sessionLookup !== null)
        {
            await redisClient.del(sessionLookup);
        }

        var session = new Session(userCheck.id);
        
        // hSet and expire have to be seperate as there isn't an expire parameter for hSet like there is for set
        await redisClient.hSet(`session:${session.sessionid}`, session);
        await redisClient.expire(`session:${session.sessionid}`, expTime);
        await redisClient.set(`sessionsIdsByUserId:${session.userid}`, `session:${session.sessionid}`, { EX: expTime });

        // We do this as we just want to return the session id, not 
        // the user id as well which is a part of the session
        res.json({ session: session.sessionid });
        return;
    });

    return router;
}