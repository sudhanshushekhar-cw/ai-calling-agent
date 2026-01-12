import express from "express";
import dotenv from "dotenv";
import voiceRoutes from "./routes/voice.routes.js";

dotenv.config();

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use("/voice", voiceRoutes);

app.listen(process.env.PORT, () => {
  console.log(`AI Voice Agent running on port ${process.env.PORT}`);
});
