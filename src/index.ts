import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import { initializeDbConnection } from "@/service/dbConnection";
import {
  getPoolPNLOfWallet,
  getListDemoWallet,
  getListPoolOfWallet,
} from "@/service/pnl";

dotenv.config();
const { PORT } = process.env;

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.get("/pool", async (req, res) => {
  const { wallet = "", pool = "" } = req.query;

  if (Boolean(wallet)) {
    const result = await getPoolPNLOfWallet(wallet, pool);
    res.json(result);
  } else {
    res.json([]);
  }
});

app.get("/pnl", async (req, res) => {
  const { wallet = "" } = req.query;

  if (Boolean(wallet)) {
    const result = await getListPoolOfWallet(wallet);
    res.json(result);
  } else {
    res.json([]);
  }
});

app.listen(PORT, async () => {
  console.log(`REST endpoint ready at port: ${PORT}`);
  await initializeDbConnection();
});

// 0xb1b9b4bbe8a92d535f5df2368e7fd2ecfb3a1950
