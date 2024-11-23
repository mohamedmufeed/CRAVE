const passport= require("passport")
const GoogleStraegy=require("passport-google-oauth20").Strategy;
const User=require("../Model/usermodel");
const { findOne } = require("../Model/adminmodel");
const env=require('dotenv').config();


passport.use( new GoogleStraegy({
    clientID:process.env.GOOGLE_CLIENT_ID,
    clientSecret:process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:"/auth/google/callback"
},

async (accessToken, refreshToken, profile, done)=>{
try {
    let user= await User.findOne({googleId:profile.id})
     if(user){
    
        return done(null,user)
     }else{
        user= new User({
            username:profile.displayName,
            email:profile.emails[0].value,
            googleId:profile.id
        })
        await user.save()
      
        return done(null,user);

     }
} catch (err) {
    return done(err,null)
}
}
))

passport.serializeUser((user,done)=>{
done(null,user.id)
});

passport.deserializeUser((id,done)=>{
User.findById(id)
.then(user=>{
    done(null,user)
})
.catch(err=>{
    done(err,null)
})
})
module.exports= passport