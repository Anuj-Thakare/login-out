import express from "express";
import path from "path";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
const app = express();
const users = [];

mongoose.connect('mongodb://Anuj1942:anuj123@ac-pprmmuo-shard-00-00.ougzmr6.mongodb.net:27017,ac-pprmmuo-shard-00-01.ougzmr6.mongodb.net:27017,ac-pprmmuo-shard-00-02.ougzmr6.mongodb.net:27017/backend?ssl=true&replicaSet=atlas-y9vn5f-shard-0&authSource=admin&retryWrites=true&w=majority', { useNewUrlParser: true });

var loginSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
});

var Login = mongoose.model('Login', loginSchema);

// Using Middleware
app.use(express.static(path.join(path.resolve(),"public"))); //for getting static file
app.use(express.urlencoded({exended:true})); //we can access the data using this.
app.use(cookieParser());

// setting up view engine
app.set("view engine","ejs");

const isAuthenticated = async (req,res,next) => {
    const {token} =  req.cookies;
    if(token){
        const decoded = jwt.verify(token,"fdughskwuiasjkoi");
        req.login = await Login.findById(decoded._id)
        next();
    }
    else{
        res.redirect("/login");
    }
}

app.get("/",isAuthenticated,(req,res)=>{
    // console.log(req.login);
    res.render("logout",{ name: req.login.name });
});

app.get("/register",(req,res)=>{
    res.render("register");
});

app.get("/login",(req,res)=>{
    res.render("login");
});

// From line 28 to 43 is same as line 54 to 63 only the next concept is explained in 1st
// app.get("/",(req,res)=>{
//     const {token} =  req.cookies;

//     if(token){
//         res.render("logout");
//     }
//     else{
//         res.render("login");
//     }
// })

app.post("/login", async (req,res)=>{
    const { email,password} = req.body;

    let login = await Login.findOne({ email });

    if(!login) return res.redirect("/register");

    //This is used to check the password is incorrect or not
    const isMatch = await bcrypt.compare(password,login.password);
    if(!isMatch) return res.render("login",{email, message:"You entered Incorrect Password"});

    const token = jwt.sign({_id: login._id}, "fdughskwuiasjkoi");
    res.cookie("token",token,{
        httpOnly:true,   //U can see the cookie on server side only not client side
        expires:new Date(Date.now()+60*1000) //Ur cookie expire after this time
    });
    res.redirect("/");
});

app.post("/register", async (req,res)=>{
    const {name,email,password}=req.body;
    let login = await Login.findOne({ email });
    if(login){
        return res.redirect("/login")
    }

    const hasshedpassword = await bcrypt.hash(password,10);
    login = await Login.create({
        name,
        email,
        password:hasshedpassword,
    })

    const token = jwt.sign({_id: login._id}, "fdughskwuiasjkoi");

    res.cookie("token",token,{
        httpOnly:true,   //U can see the cookie on server side only not client side
        expires:new Date(Date.now()+60*1000) //Ur cookie expire after this time
    });
    res.redirect("/");
})

app.get("/logout",(req,res)=>{
    res.cookie("token",null,{
        httpOnly:true,   //U can see the cookie on server side only not client side
        expires:new Date(Date.now()) //Ur cookie expire after this time
    });
    res.redirect("/");
})

app.listen(5000,()=>{
    console.log("app is working");
})