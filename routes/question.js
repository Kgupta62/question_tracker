var mongoose=require("mongoose");
// mongoose.connect("mongodb://127.0.0.1:27017/ddbase").then(()=>{
//   console.log('connected!')
// })

var questionSchema = mongoose.Schema({
  category:String,
  notes:String,
  question:String,
  link:String
});

module.exports=mongoose.model("question",questionSchema);