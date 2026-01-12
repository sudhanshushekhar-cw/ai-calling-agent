import twilio from "twilio";
import dotenv from "dotenv";

dotenv.config();

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function makeCall() {
  try {
    const call = await client.calls.create({
      to: "+916202254450",                 // 🔴 APNA Indian number
      from: process.env.TWILIO_NUMBER,     // Twilio number
      url: "https://175e5c4f8f46.ngrok-free.app/voice"   // 🔴 NGROK URL
    });

    console.log("Call initiated:", call.sid);
  } catch (err) {
    console.error("Call failed:", err.message);
  }
}

makeCall();
