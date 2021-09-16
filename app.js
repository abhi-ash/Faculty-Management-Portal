//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");
const _=require("lodash");
const pool = require("./db");


const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const methodOverride = require('method-override');
const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


mongoose.connect("mongodb://localhost:27017/facultyDB", {useNewUrlParser: true,useUnifiedTopology: true});
mongoose.set("useCreateIndex",true)



// Init gfs
let gfs;

conn.once('open', () => {
  // Init stream
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection('uploads');
});

// Create storage engine
const storage = new GridFsStorage({
  url: "mongodb://localhost:27017/facultyDB",
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = buf.toString('hex') + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: 'uploads'
        };
        resolve(fileInfo);
      });
    });
  }
});
const upload = multer({ storage });

let globalMail;

const employeeSchema={
  employeeId:Number,
  background:String,
  researchTopics:[String]
};

const Employee = mongoose.model("Employee", employeeSchema);

const educationSchema={
  employeeId:Number,
  instituteName:String,
  startYear:Number,
  endYear:Number,
  briefOverview:String,
};

const Education = mongoose.model("Education", educationSchema);

const courseSchema={
  employeeId:Number,
  courseName:String,
  courseId:String,
  courseInfo:String
};

const Course = mongoose.model("Course", courseSchema);

const publicationSchema={
  employeeId:Number,
  publicationTitle:String,
  publicationYear:Number,
  publicationInfo:String
};

const Publication = mongoose.model("Publication", publicationSchema);

app.get("/", function(req, res){
  res.render("home");
});

app.get("/home", function(req, res){
  res.render("home");
});
app.get("/login", function(req, res){
  res.render("login");
});

app.get("/faculty",async (req,res)=>{
  const fName= (await pool.query("select first_name from employee where email_id='" + globalMail + "'")).rows[0].first_name;
  const lName= (await pool.query("select last_name from employee where email_id='" + globalMail + "'")).rows[0].last_name;
  const fullName=fName.concat(lName);
  const id= (await pool.query("select employee_id from employee where email_id='" + globalMail + "'")).rows[0].employee_id;
  const leaveCount=(await pool.query("select count(*) from leave_application where employee_id=$1 and status='Waiting'",[id])).rows[0].count;
  let pendingLeaveSts;
  const currTime=(await pool.query("select now()")).rows[0].now.toJSON().slice(0,10);
  if(leaveCount!=='0')
  {
    const leaveType=(await pool.query("select leave_type from leave_application where employee_id=$1 and status='Waiting'",[id])).rows[0].leave_type;
    const leaveDate=(await pool.query("select start_date from leave_application where employee_id=$1 and status='Waiting'",[id])).rows[0].start_date.toJSON().slice(0,10);
    const leaveId=(await pool.query("select leave_id from leave_application where employee_id=$1 and status='Waiting'",[id])).rows[0].leave_id;
    if(leaveDate<currTime && leaveType==='Normal'){
      pendingLeaveSts='Last Leave was Auto Rejected';
      /*
      delete from leave_requests_hod where leave_id>0;
      delete from leave_requests_dfa where leave_id>0;
      delete from leave_requests_director where leave_id>0;*/
      (await pool.query("delete from leave_requests_director where leave_id=$1;",[leaveId]));
      (await pool.query("delete from leave_requests_dfa where leave_id=$1;",[leaveId]));
      (await pool.query("delete from leave_requests_hod where leave_id=$1;",[leaveId]));
      (await pool.query("update leave_application set status='Auto Rejected' where leave_id=$1;",[leaveId]));
    }
    else{
      pendingLeaveSts='Ongoing Leave Request'
    }
  }
  else{
    pendingLeaveSts='No Ongoing Leave Request'
  }
  res.render("faculty",{employeeName:fullName,pendingLeaveSts:pendingLeaveSts,position:'Faculty'});
});

app.get("/hoddfa",async(req,res)=>{
  const fName= (await pool.query("select first_name from employee where email_id='" + globalMail + "'")).rows[0].first_name;
  const lName= (await pool.query("select last_name from employee where email_id='" + globalMail + "'")).rows[0].last_name;
  const fullName=fName.concat(lName);
  const id= (await pool.query("select employee_id from employee where email_id='" + globalMail + "'")).rows[0].employee_id;
  const leaveCount=(await pool.query("select count(*) from leave_application where employee_id=$1 and status='Waiting'",[id])).rows[0].count;
  let pendingLeaveSts;
  const currTime=(await pool.query("select now()")).rows[0].now.toJSON().slice(0,10);
  if(leaveCount!=='0')
  {
    const leaveType=(await pool.query("select leave_type from leave_application where employee_id=$1 and status='Waiting'",[id])).rows[0].leave_type;
    const leaveDate=(await pool.query("select start_date from leave_application where employee_id=$1 and status='Waiting'",[id])).rows[0].start_date;
    const leaveId=(await pool.query("select leave_id from leave_application where employee_id=$1 and status='Waiting'",[id])).rows[0].leave_id;
    if(leaveDate<currTime && leaveType==='Normal'){
      pendingLeaveSts='Last Leave was Auto Rejected';
      (await pool.query("delete from leave_requests_director where leave_id=$1;",[leaveId]));
      (await pool.query("update leave_application set status='Auto Rejected' where leave_id=$1;",[leaveId]));
    }
    else{
      pendingLeaveSts='Ongoing Leave Request';
    }
  }
  else{
    pendingLeaveSts='No Ongoing Leave Request';
  }
  const pos= (await pool.query("select role from employee where email_id='" + globalMail + "'")).rows[0].role;
  res.render("hoddfa",{position:pos,employeeName:fullName,pendingLeaveSts:pendingLeaveSts});
});

app.get("/dir",async(req,res)=>{
  res.render("dir",{dir:"Rajeev Ahuja"});
});

app.get("/leaveApplication",async(req,res)=>{
  /*var utc = new Date();
	utc.setDate(utc.getDate());
	utc = utc.toJSON().slice(0,10);
  console.log(utc);*/
  const id= (await pool.query("select employee_id from employee where email_id='" + globalMail + "'")).rows;
  const leavesLeft=(await pool.query("select total_leaves_left from leaves_left where employee_id ='"+id[0].employee_id+"'")).rows[0].total_leaves_left;
  console.log(leavesLeft);
  if(leavesLeft===0){
    res.send("<h1>You don't have any leaves left</h1>");
  }
  else{
  res.render("leaveApplication");
  }
});

app.get("/myApplication", async (req,res)=>{
  const id= (await pool.query("select employee_id from employee where email_id='" + globalMail + "'")).rows;
  const leavesLeft=(await pool.query("select total_leaves_left from leaves_left where employee_id ='"+id[0].employee_id+"'")).rows[0].total_leaves_left;
  const ongoingLeaveCount=(await pool.query("select count(*) from leave_application where employee_id='"+id[0].employee_id+"' and status='Waiting';")).rows[0].count;
  const pastLeaves=(await pool.query("select * from leave_application where employee_id='"+id[0].employee_id+"'and status!='Waiting';")).rows;
  //const leaveType=(await pool.query("select leave_type from leave_application where employee_id='"+id[0].employee_id+"' and status='Waiting';")).rows[0].leave_type;
  console.log("BLAAAAAAAAAAAAAAAAAAAAAAAAA");
  const pos= (await pool.query("select role from employee where email_id='" + globalMail + "'")).rows[0].role;
  if(ongoingLeaveCount==='0'){
    const pendingLvSts='Accepted';
    res.render("myApplication",{leavesLeft:leavesLeft,pendingLvSts:pendingLvSts,leaves:pastLeaves,currentLeaveStatus:'Accepted'});
  }
  else{
    const ongoingLeave=(await pool.query("select * from leave_application where employee_id='"+id[0].employee_id+"' and status='Waiting';")).rows;
    const comments=(await pool.query("select * from comments where leave_id='"+ ongoingLeave[0].leave_id+"'")).rows;
    if(pos ==='FACULTY'){
      const hodStatus=(await pool.query("select status from leave_requests_hod where leave_id=$1",[ongoingLeave[0].leave_id])).rows[0].status;
      if(hodStatus==='Accepted'){
        const dfaStatus=(await pool.query("select status from leave_requests_dfa where leave_id=$1",[ongoingLeave[0].leave_id])).rows[0].status;
        if(dfaStatus==='Accepted'){
            const dirStatus=(await pool.query("select status from leave_requests_director where leave_id=$1",[ongoingLeave[0].leave_id])).rows[0].status;
            if(dirStatus!=='Accepted'){
              const status=dirStatus.concat(' ','Dir');
              res.render("myApplication",{leavesLeft:leavesLeft,pendingLvSts:dirStatus,leaves:pastLeaves,ongoingLeave:ongoingLeave,currentLeaveStatus:status,comments:comments});
            }
        }
        else{
          const status=dfaStatus.concat(' ','DFA');
          res.render("myApplication",{leavesLeft:leavesLeft,pendingLvSts:dfaStatus,leaves:pastLeaves,ongoingLeave:ongoingLeave,currentLeaveStatus:status,comments:comments});    
        }
      }
      else{
        const status=hodStatus.concat(' ','HOD');
        res.render("myApplication",{leavesLeft:leavesLeft,pendingLvSts:hodStatus,leaves:pastLeaves,ongoingLeave:ongoingLeave,currentLeaveStatus:status,comments:comments}); 
      }
    }
    else if(pos==='HOD'){
      const dirStatus=(await pool.query("select status from leave_requests_director where leave_id=$1",[ongoingLeave[0].leave_id])).rows[0].status;
      if(dirStatus!=='Accepted'){
        const status=dirStatus.concat(' ','Dir');
        res.render("myApplication",{leavesLeft:leavesLeft,pendingLvSts:dirStatus,leaves:pastLeaves,ongoingLeave:ongoingLeave,currentLeaveStatus:status,comments:comments});
      }
    }
    else if(pos==='DFA'){
      const dirStatus=(await pool.query("select status from leave_requests_director where leave_id=$1",[ongoingLeave[0].leave_id])).rows[0].status;
      if(dirStatus!=='Accepted'){
        const status=dirStatus.concat(' ','Dir');
        res.render("myApplication",{leavesLeft:leavesLeft,pendingLvSts:dirStatus,leaves:pastLeaves,ongoingLeave:ongoingLeave,currentLeaveStatus:status,comments:comments});
      }
    }
    else {
      res.send("<h1>Error Detected!!! Please Check Once Again</h1>");
  }
  }
});

app.get("/appoint",async(req,res)=>{
  const pastHOD=(await pool.query("select * from hod_history")).rows;
  const countPastHOD=(await pool.query("select count(*) from hod_history")).rows[0].count;
  const pastDFA=(await pool.query("select * from ccf_history")).rows;
  const countPastDFA=(await pool.query("select count(*) from ccf_history")).rows[0].count;
  const presentHOD=(await pool.query("select * from hod")).rows;
  const countPresentHOD=(await pool.query("select count(*) from hod")).rows[0].count;
  const presentDFA=(await pool.query("select * from ccf where position=2")).rows;
  const countPresentDFA=(await pool.query("select count(*) from ccf where position=2")).rows[0].count;
  res.render("appoint",{pastDFA:pastDFA,presentDFA:presentDFA,pastHOD:pastHOD,presentHOD:presentHOD,countPastDFA:countPastDFA,countPastHOD:countPastHOD,countPresentDFA:countPresentDFA,countPresentHOD:countPresentHOD});
});

app.get("/hoddfa",function(req,res){
  res.render("hoddfa");
});

app.get("/leaveRequests",async(req,res)=>{
  const pos= (await pool.query("select role from employee where email_id='" + globalMail + "'")).rows[0].role;
  const departmentID= (await pool.query("select department_id from employee where email_id='" + globalMail + "'")).rows[0].department_id;
  const pendingLeaves=[];
  const leaveReqComments=[];
  const pendingLeaveId=(await pool.query("select leave_id from leave_application where status='Waiting'")).rows;
  const pendingLeaveCount=(await pool.query("select count(*) from leave_application where status='Waiting'")).rows[0].count;
  for(let k=0;k<pendingLeaveCount;k++){
    const plevID=pendingLeaveId[k];
    const currenPortalTime=(await pool.query("select now()")).rows[0].now.toJSON().slice(0,10);
    const leaveDate=(await pool.query("select start_date from leave_application where leave_id=$1",[plevID.leave_id])).rows[0].start_date.toJSON().slice(0,10);
    console.log(currenPortalTime);
    console.log(leaveDate);
    const leaveType=(await pool.query("select leave_type from leave_application where leave_id=$1",[plevID.leave_id])).rows[0].leave_type;
    if(leaveDate<currenPortalTime && leaveType==='Normal'){
      console.log('kaboom');
      (await pool.query("delete from leave_requests_director where leave_id=$1;",[plevID.leave_id]));
      (await pool.query("delete from leave_requests_dfa where leave_id=$1;",[plevID.leave_id]));
      (await pool.query("delete from leave_requests_hod where leave_id=$1;",[plevID.leave_id]));
      (await pool.query("update leave_application set status='Auto Rejected' where leave_id=$1;",[plevID.leave_id]));
    }
  }
    if(pos==='HOD'){
        const leaveID=(await pool.query("select leave_id from leave_requests_hod where (status='Forwarded' or status='Hold') and department_id='"+departmentID+"'")).rows; /*Check this line*/
        const leaveCount=(await pool.query("select count(*) from leave_requests_hod where (status='Forwarded' or status='Hold') and department_id='"+departmentID+"'")).rows[0].count;
        for(let i=0;i<leaveCount;i++){
          const levID=leaveID[i];
          const currentLeaves =(await pool.query("select * from leave_application where leave_id='"+levID.leave_id+"'")).rows;
          const employeeId=(await pool.query("select employee_id from leave_application where leave_id='"+levID.leave_id+"'")).rows[0].employee_id;
          const fName= (await pool.query("select first_name from employee where employee_id='" + employeeId + "'")).rows[0].first_name;
          const sName= (await pool.query("select last_name from employee where employee_id='" + employeeId + "'")).rows[0].last_name;
          const leaveStatus=(await pool.query("select status from leave_requests_hod where leave_id='"+levID.leave_id+"'")).rows[0].status;
          const fullName=fName.concat(sName);
          pendingLeaves.push({leaveReqId:levID.leave_id,fullName:fullName,startDate:currentLeaves[0].start_date.toJSON().slice(0,10),endDate:currentLeaves[0].end_date.toJSON().slice(0,10),reason:currentLeaves[0].application,status:leaveStatus});
          const commentsCount=(await pool.query("select count(*) from comments where leave_id=$1",[levID.leave_id])).rows[0].count;
          const leaveIdComments=(await pool.query("select * from comments where leave_id=$1",[levID.leave_id])).rows;
          for(let j=0;j<commentsCount;j++){
            const lvCmnt=leaveIdComments[j];
            const department=(await pool.query("select department_name from department where department_id=$1",[lvCmnt.department_id])).rows[0].department_name;
            leaveReqComments.push({leaveId:lvCmnt.leave_id,commentBy:lvCmnt.comment_by,comment:lvCmnt.comment,commentTime:lvCmnt.comment_time,position:lvCmnt.role,status:lvCmnt.status,department:department});
          }
        }
        res.render("leaveRequests",{leaves:pendingLeaves,comments:leaveReqComments,leaveCount:leaveCount}); 
    }
    else if(pos==='DFA'){
      const leaveID=(await pool.query("select leave_id from leave_requests_dfa where status='Forwarded' or status='Hold'")).rows; /*Check this line*/
      const leaveCount=(await pool.query("select count(*) from leave_requests_dfa where status='Forwarded' or status='Hold'")).rows[0].count;
        for(let i=0;i<leaveCount;i++){
          const levID=leaveID[i];
          const currentLeaves =(await pool.query("select * from leave_application where leave_id='"+levID.leave_id+"'")).rows;
          const employeeId=(await pool.query("select employee_id from leave_application where leave_id='"+levID.leave_id+"'")).rows[0].employee_id;
          const fName= (await pool.query("select first_name from employee where employee_id='" + employeeId + "'")).rows[0].first_name;
          const sName= (await pool.query("select last_name from employee where employee_id='" + employeeId + "'")).rows[0].last_name;
          const leaveStatus=(await pool.query("select status from leave_requests_dfa where leave_id='"+levID.leave_id+"'")).rows[0].status;
          const fullName=fName.concat(sName);
          pendingLeaves.push({leaveReqId:levID.leave_id,fullName:fullName,startDate:currentLeaves[0].start_date,endDate:currentLeaves[0].end_date,reason:currentLeaves[0].application,status:leaveStatus});
          const commentsCount=(await pool.query("select count(*) from comments where leave_id=$1",[levID.leave_id])).rows[0].count;
          const leaveIdComments=(await pool.query("select * from comments where leave_id=$1",[levID.leave_id])).rows;
          for(let j=0;j<commentsCount;j++){
            const lvCmnt=leaveIdComments[j];
            const department=(await pool.query("select department_name from department where department_id=$1",[lvCmnt.department_id])).rows[0].department_name;
            leaveReqComments.push({leaveId:lvCmnt.leave_id,commentBy:lvCmnt.comment_by,comment:lvCmnt.comment,commentTime:lvCmnt.comment_time,position:lvCmnt.role,status:lvCmnt.status,department:department});
          }
        }
        res.render("leaveRequests",{leaves:pendingLeaves,comments:leaveReqComments,leaveCount:leaveCount});
    }
    else if(pos==="DIR"){
      const leaveID=(await pool.query("select leave_id from leave_requests_director where status='Forwarded' or status='Hold'")).rows; /*Check this line*/
        const leaveCount=(await pool.query("select count(*) from leave_requests_director where status='Forwarded' or status='Hold'")).rows[0].count;
        for(let i=0;i<leaveCount;i++){
          const levID=leaveID[i];
          const currentLeaves =(await pool.query("select * from leave_application where leave_id='"+levID.leave_id+"'")).rows;
          const employeeId=(await pool.query("select employee_id from leave_application where leave_id='"+levID.leave_id+"'")).rows[0].employee_id;
          const fName= (await pool.query("select first_name from employee where employee_id='" + employeeId + "'")).rows[0].first_name;
          const sName= (await pool.query("select last_name from employee where employee_id='" + employeeId + "'")).rows[0].last_name;
          const leaveStatus=(await pool.query("select status from leave_requests_director where leave_id='"+levID.leave_id+"'")).rows[0].status;
          const fullName=fName.concat(sName);
          pendingLeaves.push({leaveReqId:levID.leave_id,fullName:fullName,startDate:currentLeaves[0].start_date,endDate:currentLeaves[0].end_date,reason:currentLeaves[0].application,status:leaveStatus});
          const commentsCount=(await pool.query("select count(*) from comments where leave_id=$1",[levID.leave_id])).rows[0].count;
          const leaveIdComments=(await pool.query("select * from comments where leave_id=$1",[levID.leave_id])).rows;
          for(let j=0;j<commentsCount;j++){
            const lvCmnt=leaveIdComments[j];
            const department=(await pool.query("select department_name from department where department_id=$1",[lvCmnt.department_id])).rows[0].department_name;
            leaveReqComments.push({leaveId:lvCmnt.leave_id,commentBy:lvCmnt.comment_by,comment:lvCmnt.comment,commentTime:lvCmnt.comment_time,position:lvCmnt.role,status:lvCmnt.status,department:department});
          }
        }
        res.render("leaveRequests",{leaves:pendingLeaves,comments:leaveReqComments,leaveCount});
    }
    else {
    res.send("<h1>Error Detected!!! Please Check Once Again</h1>");
    }
});

app.get("/register",async(req,res)=>{
  res.render("register");
});

app.get("/info",async(req,res)=>{

  const employee=(await pool.query("select * from employee")).rows;
  const department=(await pool.query("select * from department")).rows;
  const hod=(await pool.query("select * from hod")).rows;
  const dfa=(await pool.query("select * from ccf where position=2")).rows;
  const dir=(await pool.query("select * from ccf where position=1")).rows;
  res.render("info",{employee:employee,department:department,hod:hod,dfa:dfa,dir:dir});
});

app.get("/back",async(req,res)=>{
  const pos= (await pool.query("select role from employee where email_id='" + globalMail + "'")).rows[0].role;
  if(pos ==='FACULTY'){
  res.redirect("/faculty");
  }
  else if(pos==='HOD'){
  res.redirect("/hoddfa");
  }
  else if(pos==='DFA'){
    res.redirect("/hoddfa");
  }
  else if(pos==='DIR'){
    res.redirect("/dir");
  }
  else {
    res.send("<h1>Error Detected!!! Please Check Once Again</h1>");
  }
});

app.get("/about/:name",async(req,res)=>{
  var reqName=_.lowerCase(req.params.name);
  const employee= (await pool.query("select * from employee")).rows;
  const employeeCount=(await pool.query("select count(*) from employee")).rows[0].count;
  for(let i=0;i<employeeCount;i++){
    let emp=employee[i];
    let fullName=_.lowerCase(emp.first_name.concat(emp.last_name));
    if(reqName===fullName){
      fullName=_.upperCase(fullName);
      const departmentId=emp.department_id;
      const department=(await pool.query("select department_name from department where department_id=$1",[departmentId])).rows[0].department_name;
      await Employee.findOne({employeeId: emp.employee_id}, function(err, backgroundInfo){
        if (!err){
            Education.find({employeeId:emp.employee_id},function(err,education){
              if(!err){
                Course.find({employeeId:emp.employee_id},function(err,course){
                  if(!err){
                    Publication.find({employeeId:emp.employee_id},function(err,publication){
                      if(!err){
                        res.render("about",{fullName:fullName,emailId:emp.email_id,department:department,education:education,course:course,publication:publication,background:backgroundInfo,researchTopics:backgroundInfo});      
                      } else{
                        res.send("<h3>Error in retreiving Publication Info</h3>");    
                      }
                    });          
                  } else{
                    res.send("<h3>Error in retreiving Course Info</h3>");
                  }
                });
              } else{
                res.send("<h3>Error in retreiving Education Info</h3>");
              }
            });
        } else{
          res.send("<h3>Error in retreiving Background Info</h3>");
        }
      });
    }
  }
});


app.get("/me",async(req,res)=>{
  const employeeId= (await pool.query("select employee_id from employee where email_id='" + globalMail + "'")).rows[0].employee_id;
  const fName= (await pool.query("select first_name from employee where email_id='" + globalMail + "'")).rows[0].first_name;
  const sName= (await pool.query("select last_name from employee where email_id='" + globalMail + "'")).rows[0].last_name;
  const fullName=fName.concat(sName);
  const departmentId= (await pool.query("select department_id from employee where email_id='" + globalMail + "'")).rows[0].department_id;
  const department=(await pool.query("select department_name from department where department_id=$1",[departmentId])).rows[0].department_name;
  await Employee.findOne({employeeId: employeeId}, function(err, backgroundInfo){
    if (!err){
        Education.find({employeeId:employeeId},function(err,education){
          if(!err){
            Course.find({employeeId:employeeId},function(err,course){
              if(!err){
                Publication.find({employeeId:employeeId},function(err,publication){
                  if(!err){
                    res.render("me",{fullName:fullName,emailId:globalMail,department:department,education:education,course:course,publication:publication,background:backgroundInfo,researchTopics:backgroundInfo});      
                  } else{
                    res.send("<h3>Error in retreiving Publication Info</h3>");    
                  }
                });          
              } else{
                res.send("<h3>Error in retreiving Course Info</h3>");
              }
            });
          } else{
            res.send("<h3>Error in retreiving Education Info</h3>");
          }
        });
    } else{
      res.send("<h3>Error in retreiving Background Info</h3>");
    }
  });
});

app.post("/updateCourse",async(req,res)=>{
  const employeeId= (await pool.query("select employee_id from employee where email_id='" + globalMail + "'")).rows[0].employee_id;
  const courseName=req.body.courseName;
  const courseId=req.body.courseId;
  const courseInfo=req.body.courseInfo;
  const crs = new Course({
    employeeId: employeeId,
    courseName:courseName,
    courseId:courseId,
    courseInfo:courseInfo
  });

  Course.create(crs, function(err){
      if (err) {
        console.log(err);
      } else {
        console.log("Successfully savevd default items to DB.");
      }
    });

  res.redirect("/me");
});

app.post("/updatePublication",async(req,res)=>{
  const employeeId= (await pool.query("select employee_id from employee where email_id='" + globalMail + "'")).rows[0].employee_id;
  const publicationTitle=req.body.publicationTitle;
  const publicationYear=req.body.publicationYear;
  const publicationInfo=req.body.publicationInfo;
  const pub= new Publication({
      employeeId: employeeId,
      publicationTitle:publicationTitle,
      publicationYear:publicationYear,
      publicationInfo:publicationInfo
    });
    
    
  Publication.create(pub, function(err){
      if (err) {
          console.log(err);
      } else {
          console.log("Successfully savevd default items to DB.");
      }
  });
  res.redirect("/me");
});

app.post("/updateEducation",async(req,res)=>{
  const employeeId= (await pool.query("select employee_id from employee where email_id='" + globalMail + "'")).rows[0].employee_id;
  const instituteName=req.body.instituteName;
  const startYear=req.body.startYear;
  const endYear=req.body.endYear;
  const briefOverview=req.body.briefOverview;
  const edu=new Education({
      employeeId:employeeId,
      instituteName:instituteName,
      startYear:startYear,
      endYear:endYear,
      briefOverview:briefOverview
  });
  Education.create(edu,function(err){
    if(err){
      console.log(err);
    } else{
      console.log("Successfully savevd default items to DB.");
    }
  });
  res.redirect("/me");
});

app.post("/updateBackground",async(req,res)=>{
  const employeeId= (await pool.query("select employee_id from employee where email_id='" + globalMail + "'")).rows[0].employee_id;
  const background=req.body.background;

  await Employee.findOneAndUpdate({employeeId: employeeId},{employeeId:employeeId,background:background},{upsert:true,new:true});
  res.redirect("/me");
});

app.post("/updateTopics",async(req,res)=>{
  const employeeId= (await pool.query("select employee_id from employee where email_id='" + globalMail + "'")).rows[0].employee_id;
  const newresearchTopics=req.body.researchTopics;
  await Employee.findOneAndUpdate({employeeId: employeeId},{employeeId:employeeId, $push:{researchTopics:newresearchTopics}},{upsert:true,new:true});
  res.redirect("/me");  
});

app.post("/delTopics",async(req,res)=>{
  const employeeId= (await pool.query("select employee_id from employee where email_id='" + globalMail + "'")).rows[0].employee_id;
  const newresearchTopics=req.body.topics;
  Employee.findOneAndUpdate({employeeId: employeeId}, {$pull: {researchTopics: newresearchTopics}}, function(err, foundList){
    if (!err){
      res.redirect("/me");
    }
  });
});

app.post("/delete",async(req,res)=>{
  const delItemId=req.body.id;
  console.log(delItemId);
  
  await Education.findByIdAndRemove(delItemId, function(err){
    if (!err) {
      console.log("Successfully deleted checked item.");
    } else{
      console.log(err);
      res.send("<h3>Error Found!</h3>");
    }
  });

  await Course.findByIdAndRemove(delItemId, function(err){
    if (!err) {
      console.log("Successfully deleted checked item.");
    } else{
      console.log(err);
      res.send("<h3>Error Found!</h3>");
    }
  });

  await Publication.findByIdAndRemove(delItemId, function(err){
    if (!err) {
      console.log("Successfully deleted checked item.");
    } else{
      console.log(err);
      res.send("<h3>Error Found!</h3>");
    }
  });
  res.redirect("/me");
});

/* app.post("/login", async(req, res)=>{
  
  globalMail=req.body.email
  console.log(globalMail)
  const pos= (await pool.query("select role from employee where email_id='" + globalMail + "'")).rows[0].role;
  req.login(user, function(err){
    if (err) {
      console.log(err);
    } else {
      console.log(pos);
      passport.authenticate("local")(req, res, function(){
        console.log("BBBBBBBBBBBB")
        if(pos ==='FACULTY'){
          console.log("AAAAAAAAAAAAAAAAAA")
        res.redirect("/faculty");
        }
        else if(pos==='HOD'){
          console.log("AAAAAAAAAAAAAAAAAB")
        res.redirect("/hoddfa");
        }
        else if(pos==='DFA'){
          console.log("AAAAAAAAAAAAAAAAAC")
          res.redirect("/hoddfa");
        }
        else if(pos==='DIR'){
          console.log("AAAAAAAAAAAAAAAAAD")
          res.redirect("/dir");
        }
        else {
          console.log("AAAAAAAAAAAAAAAAAE")
          res.send("<h1>Error Detected!!! Please Check Once Again</h1>");
        }
        });
      }
    });

}); */


app.post("/login",async(req,res)=>{
  const  mailId = req.body.email;
  globalMail=mailId;
  const pos= (await pool.query("select role from employee where email_id='" + globalMail + "'")).rows[0].role;
  if(pos ==='FACULTY'){
  res.redirect("/faculty");
  }
  else if(pos==='HOD'){
  res.redirect("/hoddfa");
  }
  else if(pos==='DFA'){
    res.redirect("/hoddfa");
  }
  else if(pos==='DIR'){
    res.redirect("/dir");
  }
  else {
    res.send("<h1>Error Detected!!! Please Check Once Again</h1>");
  }
});

app.post("/leaveApplication",async(req,res)=>{
  let leaveType;
  const starDate=req.body.startDate;
  const endDate=req.body.endDate;
  const currTime=(await pool.query("select now()")).rows[0].now.toJSON().slice(0,10);
  //starDate=starDate.slice(0,10);
  //endDate=endDate.slice(0,10);
  //console.log(starDate.slice(0,10));
  if(endDate<currTime){
    leaveType='Retrospective';
  }
  else{
    leaveType='Normal';
  }
  const id= (await pool.query("select employee_id from employee where email_id='" + globalMail + "'")).rows[0].employee_id;
  const reason=req.body.reason;
  const pos= (await pool.query("select role from employee where email_id='" + globalMail + "'")).rows[0].role;
  const countWaiting =(await pool.query("select count(*) from leave_application where status='Waiting' and employee_id='"+id+"'")).rows[0].count;
  console.log(countWaiting);
  if(countWaiting==='0'){
    (await pool.query("select insert_in_leave_application($1,$2,$3,$4,$5)",[leaveType,id,starDate,endDate,reason]));
  }
  else{
    res.send("<h1>Already one application in progress</h1>");
  }
  if(pos ==="FACULTY"){
    res.redirect("/faculty");
    }
    else if(pos==="HOD"){
    res.redirect("/hoddfa");
    }
    else if(pos==="DFA"){
      res.redirect("/hoddfa");
    }
    else if(pos==="DIR"){
      res.redirect("/dir");
    }
    else {
      res.send("<h1>Error Detected!!! Please Check Once Again</h1>");
    }
});


/* Please check from where the leave application was reverted*/
app.post("/myApplication",async(req,res)=>{
  const fName= (await pool.query("select first_name from employee where email_id='" + globalMail + "'")).rows[0].first_name;
  const sName= (await pool.query("select last_name from employee where email_id='" + globalMail + "'")).rows[0].last_name;
  const fullName=fName.concat(sName);
  const leaveComment=req.body.comment;
  console.log(leaveComment);
  const pos= (await pool.query("select role from employee where email_id='" + globalMail + "'")).rows[0].role; 
  const id= (await pool.query("select employee_id from employee where email_id='" + globalMail + "'")).rows;
  const departmentId= (await pool.query("select department_id from employee where email_id='" + globalMail + "'")).rows[0].department_id;
  const leaveId=(await pool.query("select leave_id from leave_application where employee_id='"+id[0].employee_id+"' and status='Waiting';")).rows[0].leave_id;
  //const leaveStatus=(await pool.query("select status from leave_application where leave_id='"+leaveId+"'")).rows[0].status;
  //console.log(leaveType);
  if(pos==='FACULTY'){
    const hodStatus=(await pool.query("select status from leave_requests_hod where leave_id=$1",[leaveId])).rows[0].status;
    
    if(hodStatus==='Accepted'){
      console.log("Ghussssssssaaaaaaaaaaaa");
      const dfaStatus=(await pool.query("select status from leave_requests_dfa where leave_id=$1",[leaveId])).rows[0].status;
      console.log(dfaStatus);
      if(dfaStatus==='Accepted'){
        const leaveType=(await pool.query("select leave_type from leave_application where employee_id='"+id[0].employee_id+"' and (status='Waiting');")).rows[0].leave_type;      
        console.log(leaveType);
        if(leaveType==='Retrospective'){
          const dirStatus=(await pool.query("select status from leave_requests_director where leave_id=$1",[leaveId])).rows[0].status;
          console.log(dirStatus);
          if(dirStatus==='Hold'){
            console.log("YHAAA AAYA THAAAA");
            (await pool.query("INSERT INTO comments(leave_id,comment,comment_by,comment_time,role,status,department_id) values('"+leaveId+"','"+leaveComment+"','"+fullName+"',now(),'"+pos+"','Forwarded FACULTY','"+departmentId+"');"));
            (await pool.query("update leave_requests_director set status ='Forwarded' where leave_id='"+leaveId+"'"));
          }
        }
      }
      else if(dfaStatus==='Hold'){
        (await pool.query("INSERT INTO comments(leave_id,comment,comment_by,comment_time,role,status,department_id) values('"+leaveId+"','"+leaveComment+"','"+fullName+"',now(),'"+pos+"','Forwarded FACULTY','"+departmentId+"');"));
        (await pool.query("update leave_requests_dfa set status ='Forwarded' where leave_id='"+leaveId+"'"));
      }
    }
    else if(hodStatus==='Hold'){
      (await pool.query("INSERT INTO comments(leave_id,comment,comment_by,comment_time,role,status,department_id) values('"+leaveId+"','"+leaveComment+"','"+fullName+"',now(),'"+pos+"','Forwarded FACULTY','"+departmentId+"');"));
      (await pool.query("update leave_requests_hod set status ='Forwarded' where leave_id='"+leaveId+"'"));
    }
  }
  else if(pos==='HOD'){
    const dirStatus=(await pool.query("select status from leave_requests_director where leave_id=$1",[leaveId])).rows[0].status;
    if(dirStatus==='Hold'){
      (await pool.query("INSERT INTO comments(leave_id,comment,comment_by,comment_time,role,status,department_id) values('"+leaveId+"','"+leaveComment+"','"+fullName+"',now(),'"+pos+"','Forwarded FACULTY','"+departmentId+"');"));
      (await pool.query("update leave_requests_director set status ='Forwarded' where leave_id='"+leaveId+"'"));
    }
  }
  else if(pos==='DFA'){
    const dirStatus=(await pool.query("select status from leave_requests_director where leave_id=$1",[leaveId])).rows[0].status;
    if(dirStatus==='Hold'){
      (await pool.query("INSERT INTO comments(leave_id,comment,comment_by,comment_time,role,status,department_id) values('"+leaveId+"','"+leaveComment+"','"+fullName+"',now(),'"+pos+"','Forwarded FACULTY','"+departmentId+"');"));
      (await pool.query("update leave_requests_director set status ='Forwarded' where leave_id='"+leaveId+"'"));
    }
  }
  else{
    res.send("<h1>Please Hold on!</h1>"); //if else Ongoing or already accepted case
  }
  if(pos ==="FACULTY"){
    res.redirect("/faculty");
    }
    else if(pos==="HOD"){
    res.redirect("/hoddfa");
    }
    else if(pos==="DFA"){
      res.redirect("/hoddfa");
    }
    else if(pos==="DIR"){
      res.redirect("/dir");
    }
    else {
      res.send("<h1>Error Detected!!! Please Check Once Again</h1>");
    }
});

app.post("/leaveRequests",async(req,res)=>{
  const leaveId=req.body.leaveId;
  const comment=req.body.comment;
  const status=req.body.status;
  const pos= (await pool.query("select role from employee where email_id='" + globalMail + "'")).rows[0].role;
  if(pos==='HOD'){
    (await pool.query("select hod_action('"+status+"','"+leaveId+"','"+comment+"')"));
    res.redirect("/leaveRequests");
  }
  else if(pos==='DFA'){
    (await pool.query("select dfa_action('"+status+"','"+leaveId+"','"+comment+"')"));
    res.redirect("/leaveRequests");
  }
  else if(pos==='DIR'){
    (await pool.query("select director_action('"+status+"','"+leaveId+"','"+comment+"')"));
    res.redirect("/leaveRequests");
  }
  else {
    res.send("<h1>Error Detected!!! Please Check Once Again</h1>");
  }
});

app.post("/appoint",async(req,res)=>{
  const emailId=req.body.emailId;
  const pos=req.body.pos;/*
  const presentEmployeeId=(await pool.query("select employee_id from employee where role=$1",[pos]));
  (await pool.query("update employee set role ='Faculty' where employee_id=$1",[presentEmployeeId]));*/
  const id= (await pool.query("select employee_id from employee where email_id='" + emailId + "'")).rows[0].employee_id;
  console.log(id);
  const departmentId= (await pool.query("select department_id from employee where email_id='" + emailId + "'")).rows[0].department_id;
  console.log(departmentId);
  (await pool.query("update employee set role = '"+pos+"' where employee_id='"+id+"'"));
  const currenPortalTime=(await pool.query("select now()")).rows[0].now.toJSON().slice(0,10);
  if(pos==='DFA'){
    const startDate=(await pool.query("select appointed_date from ccf where position=2")).rows[0].appointed_date; /*Integer or Varchar please check for position */
    const employeeId=(await pool.query("select employee_id from ccf where position=2")).rows[0].employee_id;
    (await pool.query("update employee set role ='FACULTY' where employee_id=$1",[employeeId]));
    (await pool.query("insert into ccf_history(employee_id,position,start_date,end_date) values($1,$2,$3,$4)",[employeeId,2,startDate,currenPortalTime]));
    (await pool.query("delete from ccf where position=2"));
    (await pool.query("insert into ccf(employee_id,position,appointed_date) values($1,$2,$3)",[id,2,currenPortalTime]));
  }
  else if(pos==='HOD'){
    const startDate=(await pool.query("select appointed_date from hod where department_id=$1",[departmentId])).rows[0].appointed_date.toJSON().slice(0,10);
    const hodId=(await pool.query("select hod_id from hod where department_id=$1",[departmentId])).rows[0].hod_id;
    (await pool.query("update employee set role ='FACULTY' where employee_id=$1",[hodId]));
    (await pool.query("insert into hod_history(hod_id,department_id,start_date,end_date) values($1,$2,$3,$4)",[hodId,departmentId,startDate,currenPortalTime]));
    (await pool.query("delete from hod where department_id=$1",[departmentId]));
    (await pool.query("insert into hod(hod_id,department_id,appointed_date) values($1,$2,$3)",[id,departmentId,currenPortalTime]));
  }
  res.redirect("/appoint");
});

app.post("/register",async(req,res)=>{
  const fName=req.body.firstName;
  const lName=req.body.lastName;
  const fullName=fName.concat(lName);
  const department=req.body.department;
  const departmentId=(await pool.query("select department_id from department where department_name=$1",[department])).rows[0].department_id;
  const employeeId=(await pool.query("select max(employee_id) from employee")).rows[0].max+1;
  console.log(employeeId);
  const emailId=fullName.concat('@iitrpr.ac.in');
  const currTime=(await pool.query("select now()")).rows[0].now.toJSON().slice(0,10);
  console.log(currTime);
  const password=req.body.password;
  (await pool.query("insert into employee(employee_id,password,first_name,last_name,email_id,department_id,date_of_joining,role,isadmin) values($1,$2,$3,$4,$5,$6,$7,$8,$9)",[employeeId,password,fName,lName,emailId,departmentId,currTime,'FACULTY','false']));
  const currYear=(await pool.query("select now()")).rows[0].now.toJSON().slice(0,4);
  (await pool.query("insert into leaves_left(employee_id,total_leaves_left,year) values($1,$2,$3)",[employeeId,30,currYear]));

  res.redirect("/home");

});

/*
app.get("/posts/:postName", function(req, res){
  const requestedTitle = _.lowerCase(req.params.postName);

  posts.forEach(function(post){
    const storedTitle = _.lowerCase(post.title);

    if (storedTitle === requestedTitle) {
      res.render("post", {
        title: post.title,
        content: post.content
      });
    }
  });
});
*/

app.listen(3000, function() {
  console.log("Server started on port 3000");
});