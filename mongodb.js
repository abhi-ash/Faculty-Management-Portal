const express = require("express");
const app = express();

const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/facultyDB", {useNewUrlParser: true,useUnifiedTopology: true});



const employeeSchema=new mongoose.Schema({
  employeeId:Number,
  background:String,
  researchTopics:[String]
});

const Employee = mongoose.model("Employee", employeeSchema);

// const employee1 = new Employee({
//   employeeId: 1,
//   background:"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua",
//   researchTopics:["Biomechanics","Biomaterials"],
// });


// Employee.create(employee1, function(err){
//     if (err) {
//       console.log(err);
//     } else {
//       console.log("Successfully savevd default items to DB.");
//     }
//   });


const educationSchema=new mongoose.Schema({
  employeeId:Number,
  instituteName:String,
  startYear:Number,
  endYear:Number,
  briefOverview:String,
});

const Education = mongoose.model("Education", educationSchema);

// const education1=new Education({
//     employeeId:1,
//     instituteName:"Indian Institute of Technology Kharagpur - Ocean Engineering & Naval Architecture",
//     startYear:1993,
//     endYear:1997,
//     briefOverview:"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ",
// });
// education1.save();


const courseSchema=new mongoose.Schema({
  employeeId:Number,
  courseName:String,
  courseId:String,
  courseInfo:String,
});

const Course = mongoose.model("Course", courseSchema);


// const course1 = new Course({
//   employeeId: 1,
//   courseName:"Computational Mechanics",
//   courseId:"CM",
//   courseInfo:"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ",
// });


// Course.create(course1, function(err){
//     if (err) {
//       console.log(err);
//     } else {
//       console.log("Successfully savevd default items to DB.");
//     }
//   });


const publicationSchema=new mongoose.Schema({
  employeeId:Number,
  publicationTitle:String,
  publicationYear:Number,
  publicationInfo:String
});

const Publication = mongoose.model("Publication", publicationSchema);

// const publication1 = new Publication({
//     employeeId: 1,
//     publicationTitle:"Rescuing loading induced bone formation at senescence",
//     publicationYear:2010,
//     publicationInfo:"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
//   });
  
  
// Publication.create(publication1, function(err){
//     if (err) {
//         console.log(err);
//     } else {
//         console.log("Successfully savevd default items to DB.");
//     }
// });
  
app.listen(3000, function() {
    console.log("Server started on port 3000");
  });