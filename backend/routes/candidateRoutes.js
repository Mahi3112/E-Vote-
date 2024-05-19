import express from "express";
import Candidate from "../models/candidateModel.js";
import { jwtAuthMiddleware } from '../jwt.js';
import User from "../models/userModel.js";
const router = express.Router();

//Function to check admin
const admin=async (userId)=>{
    try {
        const user=await User.findById(userId);
        return user.role==='admin';
    } catch (error) {
        return false;
    }
}

//Add a candidate
router.post('/',jwtAuthMiddleware,async(req,res)=>{
   
    try {
        //Check for admin
        if(!await admin(req.user.id)){
            return res.status(404).json({message:'user has no admin role'});
        }
        //Req.body contains user data
        const data=req.body

        //Create new user document 
        const newCandidate=new Candidate(data);

        //Save new user to database
        const response=await newCandidate.save();
        console.log('data saved');

        res.status(200).json({response:response});
    }
    catch (error) {
        console.log(error);
        res.status(500).json({error:'Internal Server Error'});
    }
})

//Candidate update
router.put('/:candidateID',jwtAuthMiddleware,async(req,res)=>{
    try {
         //Check for admin
         if( !await admin(req.user.id)){
            return res.status(404).json({message:'user has no admin role'});
        }

        const candidateID=req.params.candidateID
        const updateddata=req.body;
        const response= await Candidate.findByIdAndUpdate(candidateID,updateddata,{
            new:true,
            runValidators:true,
        })
        if(!response){
            return res.status(404).json({error:'Candidate not found'});
        }
        console.log('Candidate updated');
        res.status(200).json(response);
    } catch (error) {
        console.log(error);
        res.status(500).json({error:'Internal Server Error'});
    }
})

//Delete the candidate
router.delete('/:candidateID',jwtAuthMiddleware,async(req,res)=>{
    try {
         //Check for admin
         if(!await admin(req.user.id)){
            return res.status(404).json({message:'user has no admin role'});
        }

        const candidateID=req.params.candidateID;

        const response= await Candidate.findByIdAndDelete(candidateID)

        if(!response){
            return res.status(404).json({error:'Candidate not found'});
        }
        console.log('Candidate deleted');
        res.status(200).json(response);
    } catch (error) {
        console.log(error);
        res.status(500).json({error:'Internal Server Error'});
    }
})
//Let's start voting
router.post('/vote/:candidateID',jwtAuthMiddleware,async (req,res)=>{
    const candidateID=req.params.candidateID;
    const userId=req.user.id;
    try {
        //Find candidate document with specified candidate id
        const candidate=await Candidate.findById(candidateID);
        if(!candidate){
            return res.status(404).json({message:'Candidate not found'});
        }

        const user=await User.findById(userId);
        if(!user){
            return res.status(404).json({message:'User not found'});

        }
        if(user.isVoted){
            return res.status(404).json({message:'You have already voted'});

        }
        if(user.role==='admin'){
            return res.status(404).json({message:'Admin is not allowed'});

        }
        //Update the Candidate document to record the vote
        candidate.votes.push({user:userId})
        candidate.voteCount++;
        await candidate.save();

        //Update the user document
        user.isVoted=true;
        await user.save();

        res.status(200).json({message:'Vote recorded successfully'});

    } catch (error) {
        console.log(error);
        res.status(500).json({error:'Internal Server Error'});
    }
})

//Find vote count
router.get('/vote/count',async(req,res)=>{
    try {
        //Find all candidates and sort them in desc by vote count
        const candidate= await Candidate.find().sort({voteCount:'desc'});
        //Map the candidates to only name and count
        const record=candidate.map((data)=>{
            return{
                party:data.party,
                count:data.voteCount
            }
        });
        return res.status(200).json(record);

    } catch (error) {
        console.log(error);
        res.status(500).json({error:'Internal Server Error'});
    }
})
//List of candidates
router.get('/list',async(req,res)=>{
    try {
        const getCandidate=Candidate.find();
        const candidate=getCandidate.map((value)=>{
            return{
                name:value.name,
                party:value.party
            }
        });
        return res.status(200).json(candidate);
        
    } catch (error) {
        console.log(error);
        res.status(500).json({error:'Internal Server Error'});
    }
})

export default router;