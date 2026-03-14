const dotenv = require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dayjs = require("dayjs");
const rateLimit = require("express-rate-limit");
const sendEmailCustomer = require("./utils/sendEmailCustomer.js");
const sendEmailCompany = require("./utils/sendEmailCompany.js");
const app = express();

const emailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: "Too many requests, please try again later." },
});

const corsOptions = {
  origin: "https://tinosmiles.gr",
  optionSuccessStatus: 200,
};

//Midleware

app.use(express.json());
app.use(bodyParser.json());
app.use(cors(corsOptions));

//create route

app.get("/", (req, res) => {
  res.send(`TinosMiles Service Running ${new Date()}`);
});

app.post("/api/sendemail", emailLimiter, async (req, res) => {
  const origin = req.get("Origin");
  if (origin !== corsOptions.origin) {
    return res.status(403).send("Forbidden");
  }
  const {
    name,
    email,
    pickupDate,
    returnDate,
    pickupTime,
    returnTime,
    pickupLocation,
  } = req.body;

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (
    !name || typeof name !== "string" || name.trim().length < 2 ||
    !email || !emailRegex.test(email) ||
    !pickupDate || !returnDate ||
    !pickupTime || !returnTime ||
    !pickupLocation
  ) {
    return res.status(400).json({ success: false, message: "Invalid or missing fields." });
  }

  let rentDays;
  rentDays = dayjs(returnDate).diff(dayjs(pickupDate), "day");
  if (!rentDays) {
    rentDays = 1;
  }

  const highSeason = rentDays * 50;
  const lowSeason = rentDays * 40;
  const discountApplied = rentDays > 10;

  try {
    const send_to_service = process.env.EMAIL_USER;
    const send_to = email;
    const sent_from = process.env.EMAIL_USER;
    const reply_to = process.env.EMAIL_USER;
    const reply_to_customer = email;
    const subject_service = `Car Inquiry - ${pickupDate} to ${returnDate} `;
    const message_service = `
	<html>
	<head>
	<title>Request from Tinos Miles contact form</title>
	</head>
	<body>
	<h2>Request from: <strong>${name}</strong></h2>
	<p>Pick-up <strong>${pickupDate} at ${pickupTime}</strong>  || Drop-off <strong>${returnDate} at ${returnTime}</strong></p>
	<p>Location <strong>${pickupLocation}</strong></p>
	<p>Total days: <strong>${rentDays}</strong> </p>
	<p>${
    discountApplied ? "<strong>10% discount applies</strong>" : "No discount"
  }</p>
	<p>Final cost for low season at 40e/day : ${
    discountApplied
      ? `<span style=" text-decoration: line-through;">${lowSeason}</span> <strong>${
          lowSeason * 0.9
        }</strong>`
      : `<strong>${lowSeason}</strong>`
  }</p>
	<p>Final cost for high season at 50e/day :  ${
    discountApplied
      ? `<span style=" text-decoration: line-through;">${highSeason}</span> <strong>${
          highSeason * 0.9
        }</strong>`
      : `<strong>${highSeason}</strong>`
  }</p>
	</body>
	</html>
	`;
    const subject = "Tinos Miles Car Rental Services | Automated Response";
    const message = `<html>
  <head>
    <title>Tinos Miles Car Rental Service</title>
  </head>
  <body style="background-color:#f7f7f7; font-family:Arial, sans-serif; font-size:16px; line-height:1.5; color:#333333;">
    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px; margin:0 auto;">
      <tr>
        <td align="center" bgcolor="#6ac1b7" style="border-radius:5px; box-shadow:0px 2px 5px rgba(0,0,0,0.1); padding:20px;">
          <h1 style="font-size:28px; margin:0;color:#fff;">Tinos Miles Car Rental Service</h1>
        </td>
      </tr>
      <tr>
        <td align="left" bgcolor="#ffffff" style="border-radius:5px; box-shadow:0px 2px 5px rgba(0,0,0,0.1); padding:50px 10px 25px;">
          <p style="margin:0 0 20px 0;color:rgb(10, 150, 149);font-weight:600; font-size:24px;">Hi, ${name}</p>
          <p style="margin:0 0 20px 0;">Thank you for contacting Tinos Miles with the following inquiry:</p>
          <p style="margin:0 0 10px 0;">Pick-up <strong>${pickupDate}</strong> at <strong>${pickupTime}</strong></p>
          <p style="margin:0 0 10px 0;">Drop-off <strong>${returnDate}</strong> at <strong>${returnTime}</strong></p>
          <p style="margin:0 0 20px 0;">Location <strong>${pickupLocation}</strong></p>
          <p style="margin:0;">Total days: <strong>${rentDays}</strong></p>
          <p style="margin:20px 0 0;">We will get back to you as soon as possible.</p>
          <p style="margin:20px 0 0;color:rgb(10, 150, 149);font-weight:600;letter-spacing:1.1px;text-align:center;">In the meantime&nbsp;click&nbsp;the button below to check out&nbsp;a&nbsp;our guide from Tinos&nbsp;with our tips&nbsp;on what to see and where to go.</p>
          <a href="https://tinosmiles.gr/tinos-island-guide" target="_blank" style="text-decoration:none;">
          <p style="margin:20px auto;text-align:center;background-color:rgb(230, 126, 34);max-width:120px;
                    padding:12px 24px;border-radius:9px;color:#fff">Go to Guide</p>
          </a>
          <p style="margin:40px auto 0;text-align:center;">Have a&nbsp;question? <a href="mailto:contact@tinosmiles.gr" target="_blank" style="color: #127DB3; font-family: sans-serif; font-size: 17px; font-weight: 400; line-height: 160%;">contact@tinosmiles.gr</a></p>
        </td>
    </table>
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="60%" style="max-width:600px; margin:20px auto 0;">
      <tr>
        <td style="width:50%; vertical-align:top; padding:10px;text-align:center;">
          <!-- Left column content goes here -->
          <a href="https://www.instagram.com/tinosmiles/" target="_blank" style="text-decoration:none;color:#feda75;font-weight:600;background-color:#d62976;padding:10px 20px;border-radius:9px;">
          Instagram
          </a>
        </td>
        <td style="width:50%; vertical-align:top; padding:10px;text-align:center;">
          <!-- Right column content goes here -->
          <a href="https://www.facebook.com/tinossmiles/" target="_blank" style="text-decoration:none;color:#8b9dc3;font-weight:600;background-color:#dfe3ee;padding:10px 20px;border-radius:9px;">
         Facebook
          </a>
        </td>
      </tr>
    </table>
    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px; margin:0 auto;font-size:12px;">
      <tr>  
        <td align="center" style="border-radius:5px; padding:10px;">
          <p style="margin:0; color:#777777;">&nbsp;&copy; Tinos Miles 2023&nbsp;|&nbsp;Car Rental Services &nbsp;|&nbsp;Ag.markos,     Tinos 84200<br/>GNTO Reg. No:1178E81000946601&nbsp;|&nbsp;
          <a href="tel:+30 6944187668" target="_blank" style="text-decoration: none;color:#777777;">Tel:+30 694 4187 668</a></p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

    await sendEmailCustomer(subject, message, send_to, sent_from, reply_to);
    await sendEmailCompany(
      subject_service,
      message_service,
      send_to_service,
      sent_from,
      reply_to_customer
    );

    res.status(200).json({ success: true, message: "Email Sent" });
  } catch (err) {
    res.status(500).json(err.message);
    console.log(err.message);
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}...`);
});
