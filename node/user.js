"use strict";

import mongoose from "mongoose";

var userSchema;
var UserModel;

// This needs to be called when the program starts to setup the schema and model for mongoose
export function userSetup()
{
    userSchema = new mongoose.Schema({
        username: String,
        password: String,
        avatar: String
    });

    UserModel = mongoose.model(process.env.MONGO_COLL_NAME, userSchema);
}

// Creates a new user and saves it to mongodb if it doesn't already exist
// returning a User object which is more easily used by the rest of the code
export async function createNewUser(username_, password_, avatar_)
{
    if(await UserModel.exists({ username: username_ }))
        return null;

    let newUser = new UserModel({ username: username_, password: password_, avatar: avatar_});

    await newUser.save();

    return new User(newUser);
}

// User object, created using a user model which contains all the user
// data along with an ID provided by mongodb
export class User 
{
    constructor(userModel) 
    {
        this.id = userModel.id;
        this.username = userModel.username;
        this.password = userModel.password;
        this.avatar = userModel.avatar;
        this.model = userModel; // Storing the model along with ID to make it easier to update
    }
}

// Given a user ID finds that user if they exist in mongodb
// returns as a User object as that's easier to deal
// with in other parts of the code
export async function findUser(userId)
{
    var checkExists = false;

    // This is to handle potentially invalid IDs being used
    try 
    {
        checkExists = await UserModel.exists({ _id: userId })
    } 
    catch (error) { }

    if(checkExists)
        return new User(await UserModel.findById(userId));

    return null;
}

// Given a username finds that user if they exist in mongodb
// returns as a User object as that's easier to deal
// with in other parts of the code
export async function findUserByName(username_)
{
    if(await UserModel.exists({ username: username_ }))
        return new User(await UserModel.findOne({ username: username_ }));

    return null;
}

// Given a user, and obj which currently when called is just req.body
// and a property this function will replace that property on the user
// with that same property but on the passed in object.  Returns
// the user after this operation is done.  
export async function replaceUserProperty(user, obj, property)
{
    if(obj.hasOwnProperty(property))
    {
        user[property] = obj[property];
        user.model[property] = obj[property];

        await user.model.save();
    }

    return user;
}