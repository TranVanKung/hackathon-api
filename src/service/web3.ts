import Web3 from "web3";
import dotenv from "dotenv";
import { PANCAKE_ABI } from "@/asset/abi";

dotenv.config();
const { NODE_ENDPOINT = "" } = process.env;

export const web3Instance = new Web3(
  new Web3.providers.HttpProvider(NODE_ENDPOINT)
);

const getReserveInPool = async (
  poolAddress: string,
  blockNumber?: number | string
) => {
  try {
    const contract = new web3Instance.eth.Contract(
      JSON.parse(PANCAKE_ABI),
      poolAddress
    );

    const reserveRes = await contract.methods
      .getReserves()
      .call(null, blockNumber || "latest");
    const reserve0 = reserveRes?._reserve0;
    const reserve1 = reserveRes?._reserve1;

    const totalSupply = await contract.methods
      .totalSupply()
      .call(null, blockNumber || "latest");

    return {
      reserve0,
      reserve1,
      totalSupply,
    };
  } catch (error: any) {
    console.log("getReserveInPool error", error);
  }
};

export { getReserveInPool };
