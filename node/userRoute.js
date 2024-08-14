"use strict";

import { Router } from 'express';
import { createNewUser, findUser, findUserByName, replaceUserProperty} from './user.js';
import { findSession } from './session.js';

export default (redisClient) => 
{
    let router = Router();

    // If we get a post request to users that means we need to create a user
    router.post('', async (req, res) => 
    {
        var newUser = await createNewUser(req.body.username, req.body.password, req.body.avatar);

        if(newUser === null)
        {
            res.sendStatus(409);
            return;
        }

        res.json(newUser);
    }); 

    // If we get a put request with an id that means we need to update a user
    router.put('/:id', async (req, res) => {
        var session = await findSession(redisClient, req.body.session);
        var user = await findUser(req.params.id);
        
        // Order of these checks matters, session errors -> user error -> incorrect user error
        // Makes sure session is valid first before worrying about if id exists before 
        // worrying about if user's session is correct for the user they're updating
        if(session === null)
        {
            res.sendStatus(401);
            return;
        }

        if(user === null)
        {
            res.sendStatus(404);
            return;
        }

        if(session.userid !== user.id)
        {
            res.sendStatus(403);
            return;
        }

        // Update the properties of the user instead of making a new user
        // object so that the id stays the same even with a new name
        await replaceUserProperty(user, req.body, 'username');
        await replaceUserProperty(user, req.body, 'password');
        await replaceUserProperty(user, req.body, 'avatar');

        res.json(user);
    });

    // If we get a get request to users then someone is trying to get a user by name
    router.get('', async (req, res) => {
        var session = await findSession(redisClient, req.body.session);

        // Order of these checks matters, session errors -> query errors -> user errors
        // Makes sure session is valid before worrying about if there is a username query
        // before worrying if the user provided is valid
        if(session === null)
        {
            res.sendStatus(401);
            return;
        }

        if(!req.query.username)
        {
            res.sendStatus(400);
            return;
        }

        // Make sure we have a username and session before trying to find user
        var user = await findUserByName(req.query.username);

        if(user === null)
        {
            res.sendStatus(404);
            return;
        }

        // Only include the password if the user in the session matches
        // the user being searched for.
        if(user.id !== session.userid)
        {
            delete user.password;
        }

        res.json(user);
    });

    // If we get a get request with an id then someone is trying to get a user by id
    router.get('/:id', async (req, res) => {
        var session = await findSession(redisClient, req.body.session);
        var user = await findUser(req.params.id);

        // Order of these checks matters, session errors -> user errors
        // Makes sure session is valid before worrying if the user provided is valid
        if(session === null)
        {
            res.sendStatus(401);
            return;
        }

        if(user === null)
        {
            res.sendStatus(404);
            return;
        }

        // Only include the password if the user in the session matches
        // the user being searched for.
        if(user.id !== session.userid)
        {
            delete user.password;
        }

        res.json(user);
    });

    return router;
}