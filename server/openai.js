import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

console.log("API KEY LOADED:", process.env.OPENAI_API_KEY?.slice(0, 8));
