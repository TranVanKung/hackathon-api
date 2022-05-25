import mongoose, { Schema } from "mongoose";
import { CHAIN } from "@/constant";

const tokenSchema = new Schema(
  {
    address: { type: String },
    name: { type: String },
    decimals: { type: String, default: 0 },
    symbol: { type: String },
    depositAmount: { type: Number },
    depositFiatAmount: { type: Number },
  },
  { _id: false }
);

const transferEventSchema = new Schema(
  {
    blockNumber: { type: Number },
    blockHash: { type: String },
    blockTime: { type: Number },
    txHash: { type: String, required: true, unique: true },
    lpToken: { type: String, required: true },
    lpDecimals: { type: Number, default: 0 },
    from: { type: String, required: true },
    to: { type: String },
    amount: { type: String },
    chain: { type: String, enum: Object.values(CHAIN) },
    token0: tokenSchema,
    token1: tokenSchema,
  },
  { timestamps: true }
);

export default mongoose.model("TransferEvent", transferEventSchema);
