import express from "express";
import User from "./../models/userModel.js";
import { jwtAuthMiddleware, generateToken } from './../jwt.js';
const router = express.Router();

//Only one admin function
const oneadmin = async () => {
    try {
        const admin = await User.findOne({ role: 'admin' });
        if (admin) {
            return false;
        } else {
            return true;
        }
    } catch (error) {
        console.error('Error checking admin existence:', error);
        return false;
    }
};

//Singup Route
router.post('/signup',async(req,res)=>{
    try {
        const isAdminAllowed = await oneadmin();
        if (!isAdminAllowed && req.body.role === 'admin') {
            return res.status(400).json({ message: 'Admin already exists' });
        }
       
        //Req.body contains user data
        const data=req.body

        //Create new user document 
        const newUser=new User(data);

        //Save new user to database
        const response=await newUser.save();
        console.log('data saved');

        const payload={
            id:response.id,
            
        }
        console.log(JSON.stringify(payload));
        const token=generateToken(payload);
        console.log("Token is ",token);
        res.status(200).json({response:response,token:token});
    }
    catch (error) {
        console.log(error);
        res.status(500).json({error:'Internal Server Error'});
    }
})

//Login Route
router.post('/login',async(req,res)=>{
    try {
        //Extract aadharnumber and password from req.body
        const {aadharnumber,password}=req.body;
        //Find user by aadharnumber
        const user=await User.findOne({aadharnumber:aadharnumber});
        //If user does not exist or password does not match , return error
        if(!user||!(await user.comparePassword(password))){
            return res.status(401).json({
                error:'Invalid aadharnumber or password'
            });
        }
        //Generate token
        const payload={
            id:user.id,
        }
        const token =generateToken(payload);
        //return token as response
        res.json({token})
    } catch (error) {
        console.log(error);
        res.status(500).json({error:'Internal Server Error'});
    }
});

//Profile Route
router.get('/profile',jwtAuthMiddleware,async(req,res)=>{
    try {
        const userData=req.user;

        const userId=userData.id;
        const user=await User.findById(userId);

        res.status(200).json({user});
    } catch (error) {
        console.log(error);
        res.status(500).json({error:'Internal Server Error'});
    }
})
//Change password Route
router.put('/profile/password',jwtAuthMiddleware,async(req,res)=>{
    try {
        //Extract id from token
        const userId=req.user.id
        const{currentPassword,newPassword}=req.body
        //Find the user by userid
        const user=await User.findById(userId);
        //If password does not match,return error
        if(!(await user.comparePassword(password))){
            return res.status(401).json({
                error:'Invalid password'
            });
        }
        //Update password
        user.password=newPassword;
        await user.save();
        console.log('Password updated');
        res.status(200).json({message:'Password updated'});
    } catch (error) {
        console.log(error);
        res.status(500).json({error:'Internal Server Error'});
    }
})

export default router;