import express from "express";
import { VoiceResponse } from "../services/twilio.service.js";
import { getAIReply } from "../services/ai.service.js";
import agent from "../config/agent.config.js";

const router = express.Router();

/**
 * Track clarification attempts per call
 */
const clarificationCount = new Map();

/**
 * Track "Okay" acknowledgement per turn
 */
const acknowledgementSpoken = new Map();

/**
 * ENTRY POINT – GREETING (ONLY ONCE)
 */
router.post("/", (req, res) => {
    const twiml = new VoiceResponse();

    const gather = twiml.gather({
        input: "speech",
        language: agent.language,
        action: "/voice/process",
        timeout: 3,
        speechTimeout: "auto"
    });

    gather.say(
        { voice: agent.voice },
        `Hello, welcome to Rolay Hotel. This is ${agent.name} speaking. What would you like to know today?`
    );


    res.type("text/xml").send(twiml.toString());
});

/**
 * PROCESS USER SPEECH + AI RESPONSE
 */
router.post("/process", async (req, res) => {
    const callSid = req.body.CallSid;
    const speech = req.body.SpeechResult;
    const twiml = new VoiceResponse();

    // Initialize maps for new call
    if (!clarificationCount.has(callSid)) {
        clarificationCount.set(callSid, 0);
    }
    if (!acknowledgementSpoken.has(callSid)) {
        acknowledgementSpoken.set(callSid, false);
    }

    // Silence handling
    if (!speech) {
        twiml.say(
            { voice: agent.voice },
            "I didn’t catch that. Please say it again."
        );
        twiml.redirect("/voice/listen");
        return res.type("text/xml").send(twiml.toString());
    }

    // Increment clarification counter
    const count = clarificationCount.get(callSid) + 1;
    clarificationCount.set(callSid, count);

    try {
        // 🔒 Say "Okay" only ONCE per user turn
        if (!acknowledgementSpoken.get(callSid)) {
            twiml.say(
                { voice: agent.voice }
            );
            acknowledgementSpoken.set(callSid, true);
        }

        let reply;

        // 🔥 Force answer mode if user unclear multiple times
        if (count > 2) {
            reply = await getAIReply(
                callSid,
                `Give a direct and helpful explanation for: ${speech}`
            );
        } else {
            reply = await getAIReply(callSid, speech);
        }

        twiml.say({ voice: agent.voice }, reply);

        // Reset acknowledgement for next turn
        acknowledgementSpoken.set(callSid, false);

    } catch (e) {
        console.error("AI ERROR:", e.message);
        twiml.say(
            { voice: agent.voice },
            "Sorry, I had trouble answering that."
        );
    }

    // 🔁 Listen again (NO greeting)
    twiml.redirect("/voice/listen");
    res.type("text/xml").send(twiml.toString());
});

/**
 * LISTEN ONLY (NO GREETING)
 */
router.post("/listen", (req, res) => {
    const twiml = new VoiceResponse();

    twiml.gather({
        input: "speech",
        language: agent.language,
        action: "/voice/process",
        timeout: 3,
        speechTimeout: "auto"
    });


    res.type("text/xml").send(twiml.toString());
});


export default router;
