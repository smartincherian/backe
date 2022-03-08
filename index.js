const express = require('express');
const cors = require('cors');
const path = require('path');
const UserInfo = require('./src/model/UsersDB');
const ScheduleInfo = require('./src/model/ScheduleDB');
require('dotenv').config();
const mailer = require("nodemailer");
const multer = require('multer');
const moment = require('moment') ;

const app = express();
app.use(cors());

//static file
// app.use(express.static(path.join(__dirname, '/src/build')));
// app.use('/static', express.static('/src/build'))

app.use(express.static('public'))
app.use('/static', express.static('public'))
app.use('/static', express.static(path.join(__dirname, 'public')))

// Post Method
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


const storage = multer.diskStorage({
    destination: path.join(__dirname, 'public'),
    filename: function (req, file, cb) {   
        // null as first argument means no error
        cb(null, Date.now() + '-' + file.originalname )  
    }
})


// app.get('/', (req,res)=>{
//     res.send("Hello World");
// })

//photoupload
app.post('/api/photo/:id', async (req, res) => {	

    const id = req.params.id;
    try{
        

        let upload = multer({ storage: storage}).single('photo');
       

        upload(req, res, function(err) {
            if (!req.file) {
                return res.send('Please select an image to upload');
            }
            else if (err instanceof multer.MulterError) {
                return res.send(err);
            }
            else if (err) {
                return res.send(err);
            }
            const update = {
				photo: req.file.path
			};
            const photo = req.file.filename;
            // console.log(update);
            console.log(photo);
            console.log(id);
            const filter = { id: id };
            UserInfo.findOneAndUpdate(filter, {photo: photo}, { new: true })
            .then(function(users){
            res.json(users)
    });
        });  
    }catch (err) {console.log(err)}
    }); 

//Allocate specific trainer
app.get('/api/search/:id', (req, res) => {
    const id = req.params.id;
    const filter = { id: id };
    UserInfo.find(filter)
    .then(function(users){
        res.json(users)
    });
});

// Basic Approval Pending Trainers List Fetch Route
app.get('/api/pending', (req, res) => {
    const filter = { approved: false };
    UserInfo.find(filter)
    .then(function(users){
        res.json(users)
    });
    
});

// Approval pending trainer indivual details
app.get('/api/pending/:_id', (req, res) => {
    const _id = req.params._id;
    UserInfo.findOne({_id: _id})
    .then(function(users){
        res.json(users)
    });
    
});

// Trainer approval
app.post('/api/pending/:_id/approve', (req, res) => {
    const type = req.body.type;
    const id = req.body.id;
    const name=req.body.name;
    const email=req.body.email;
    const _id = req.params._id;
    let from = `ICT Academy <ictakprojectgroup@gmail.com>`
    console.log(id);
    let body ={
        from: from,
        to: `${email}`,
        subject: 'Trainer Approval',
        html: `<p>Dear <b>${name}</b>,<br> </br> <br> </br> We acknowledge the reciept of your Trainer Application. <br> </br> We are happy to inform you that your application has been <b>APPROVED</b>.<br> </br>  <br> </br> Please note the below details:<br> </br> <br><b> ID:${id}<br> </br> Type of Employment:<span style="text-transform:uppercase"> ${type} </span></b><br> </br><br> </br><i> Wishing all the best. </i><br> </br> <br> </br>Thanks and Regards,<br> </br> <b>ICTAK Academy</b></p><br>`,
    }
    
    const transporter =   mailer.createTransport({
        service: 'gmail',
        auth:{
            user: process.env.EMAIL_USER,
            pass : process.env.EMAIL_PASS
        }
    })
    
    // verify connection configuration
    transporter.verify(function(error, success) {
      if (error) {
        console.log(error);
      } else {
        console.log("Server is ready to take our messages");
      }
    });
    
    transporter.sendMail(body,(err, result) =>{
        if (err) {
            console.log(err);
            return false
        }
        console.log(result);
        console.log("email sent");
    })

    
    const filter = { _id: _id };
    UserInfo.findOneAndUpdate(filter, {type:type, approved:'true'}, { new: true })
    .then(function(users){
        res.json(users)
    });
    
});

// Approved Trainer List
app.get('/api/search', (req, res) => {
    const filter = { approved: true };
    UserInfo.find(filter)
    .then(function(users){
        res.json(users)
    });
});

// Schedule List
app.get('/api/schedule', (req, res) => {
    ScheduleInfo.find()
    .then(function(users){
        res.json(users)
    });
});

 //batch allocation
    app.post('/api/schedule/:_id', (req, res) => {
    const { id, name, email, course, batch, startDate, endDate, meeting, startTime, endTime } = req.body;
    // console.log(req.body);
    
    // two ranges overlap if ((StartDate1 <= EndDate2) && (StartDate2 <= EndDate1))
    ScheduleInfo.find({id: id},{startDate:1,endDate:1,_id:0}).then(existingDate => {
        
        // let existingStartDate = moment(existingDate[0].startDate).format('DD/MMM/YYYY');
        // let existingEndDate = moment(existingDate[0].endDate).format('DD/MMM/YYYY');
        let j=0;
        
        let sDate = moment(startDate).format('DD/MMM/YYYY');
        let eDate = moment(endDate).format('DD/MMM/YYYY');

        for(i=0;i<existingDate.length;i++){
            if(((moment(existingDate[0].startDate).format('DD/MMM/YYYY')) <= eDate) && (sDate <= (moment(existingDate[0].endDate).format('DD/MMM/YYYY')))){
                j=j+1
            }
        } //for loop
        console.log(j);
        
        // if((existingStartDate <= eDate) && (sDate <= existingEndDate)){
            if(j>0){
            console.log("overlap");
            return res.status(409).send("Overlap");
        }
        else{
            let from = `ICT Academy <ictakprojectgroup@gmail.com>`
        console.log(id);
    let body ={
        from: from,
        to: `${email}`,
        subject: 'Trainer Allotment',
        html: `<p>Dear <b>${name}</b>,<br> </br> <br> </br> Please find the Allotment Details: <br> </br> <br><b> Course:${course}<br> </br> <br><b> Batch:${batch}<br> </br>  <br><b> Start Date:${startDate}<br> </br> <br><b> End Date:${endDate}<br> </br> </br><br> <br><b> Meeting Link:${meeting}<br> </br>  </br><i>  </br> <br> </br>Thanks and Regards,<br> </br> <b>ICTAK Academy</b></p><br>`,
    }
    
    const transporter =   mailer.createTransport({
        service: 'gmail',
        auth:{
            user: process.env.EMAIL_USER,
            pass : process.env.EMAIL_PASS
        }
    })
    
   
    // verify connection configuration
    transporter.verify(function(error, success) {
      if (error) {
        console.log(error);
      } else {
        console.log("Server is ready to take our messages");
      }
    });
    
    transporter.sendMail(body,(err, result) =>{
        if (err) {
            console.log(err);
            return false
        }
        console.log(result);
        console.log("email sent");
    })
    const update = {id,name,course, batch, startDate, endDate, meeting, startTime, endTime };
    console.log(update);
    ScheduleInfo.insertMany(update)
    .then(function(users){
        res.json(users)
    });
        }
    });
    
    
});


// Port number
app.listen(5000, () => {
    console.log("Listening on port 5000");
})