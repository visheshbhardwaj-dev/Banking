const {Worker} = require("bullmq");
const redisConnection = require("../src/config/redis");
const sendEmail =  require("../utils/sendEmail");


const worker =  new Worker(
    "email-Queue",
    async(job)=>{
        const {to,subject,text,html} = job.data;
           await sendEmail(
              to,
              subject,
              text,
               html
            );


    }, 
    {connection:redisConnection}
);

worker.on("completed",(job)=>{
   console.log(
      `Email job completed:
       ${job.id}`
   );
});

worker.on(
  "failed",
  (job, err) => {
    console.log(
      "Email failed",
      err
    );
  }
);




