"use strict";

// Just using consts for now, will change this in later assignments
const secret = process.env.SHARED_SECRET;
const port = process.env.GAME_PORT;

import { Router } from 'express';
import { createHash } from "crypto";
import { findUser } from "./user.js";
import { findSession } from "./session.js";

export default (redisClient) => 
{
    let router = Router();

    // If we get a post request to connect then a user is connecting
    router.post('', async (req, res) => 
    {
        let session = await findSession(redisClient, req.body.session);

        // Order of these checks matters, session errors -> user error -> no game_type error
        // Makes sure session is valid first before worrying about if id exists before 
        // worrying about if the user supplied a game_type
        if(session === null)
        {
            res.sendStatus(401);
            return;
        }

        // Make sure we have a valid session before we try to find a user using it
        let user = await findUser(session.userid);

        if(user === null)
        {
            res.sendStatus(404);
            return;
        }

        if(req.body.game_type === undefined)
        {
            res.sendStatus(400);
            return;
        }

        // Calculate the token in the same way the Cpp project does and hash it
        let plaintextToken = user.username + user.avatar + req.body.game_type + secret;
        let token = createHash('sha256').update(plaintextToken).digest('base64');

        // Since the response isn't like any of the classes we have we create our own object
        // to send back with the correct data in it
        res.json({ username: user.username, avatar: user.avatar, game_port: parseInt(port), token: token });
        return;
    });

    return router;
}