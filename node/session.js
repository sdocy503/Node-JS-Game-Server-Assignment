"use strict";

import uuid4 from 'uuid4';

// Session object, all it contains is a randomly generated
// session id and the user id the session is associated with
export class Session 
{
    constructor(userid) 
    {
        this.userid = userid;
        this.sessionid = uuid4();
    }
}

// Gets the session with the provided ID using the provided redis client
export async function findSession(redisClient, sessionId)
{
    let session = await redisClient.hGetAll(`session:${sessionId}`).catch((err)=> {
        return null;
    });

    // Result if there is no session with the provided ID is an empty object
    // so this checks if a session with the ID was found
    if(!Object.keys(session).length)
    {
        return null;
    }

    return session;
}