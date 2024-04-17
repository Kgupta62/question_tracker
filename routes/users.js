
var mongoose=require("mongoose");
var pla=require('passport-local-mongoose');
// mongoose.connect("mongodb://127.0.0.1:27017/ddbase");
var userSchema = mongoose.Schema({
   username:String,
   password:String,
   email:String,
   number:Number,
});


userSchema.plugin(pla);
module.exports=mongoose.model("user",userSchema);
