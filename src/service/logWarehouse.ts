import axios from "axios";
import _ from "lodash";
import dotenv from "dotenv";
import { API_TIMEOUT, CHAIN, BAD_TOKEN } from "@/constant";
import { createTransferEvent } from "@/service/transferEvent";

dotenv.config();
const { CHAIN_ID } = process.env;

export const lwAxios = axios.create({
  baseURL: "https://log-warehouse-bsc-dev.krystal.team/v1",
  timeout: API_TIMEOUT,
});

export const contractInfoAxios = axios.create({
  baseURL: "https://contract-info-dev.krystal.team",
  timeout: API_TIMEOUT,
});

export const coinGekoAxios = axios.create({
  baseURL: `https://api.coingecko.com/api/v3/coins/${CHAIN_ID}`,
  timeout: API_TIMEOUT,
});

const getTransferEvent = async () => {
  const START_BLOCK = 17000000;
  const END_BLOCK = 18078999;
  let currentStep = START_BLOCK;
  const batchSize = 5;

  try {
    while (currentStep < END_BLOCK) {
      const res = await lwAxios.get(
        `/getEvents?from=${currentStep}&to=${currentStep + batchSize}`
      );

      // get list distinct token
      let listToken = res?.data?.map((event: any) =>
        formatTokenAddress(String(event?.token))
      );
      listToken = _.uniq(listToken);

      // if a token is LP token, it's information must be in pool-info
      const listPool: any = await getListPoolInfo(listToken);
      const mapOfPool: any = {};
      listPool.forEach((pool: any) => {
        mapOfPool[formatTokenAddress(String(pool?.address))] = pool;
      });

      // just keep track transfer event of LP token
      let listTransferEvent = res?.data?.filter((event: any) => {
        return mapOfPool[formatTokenAddress(String(event?.token))];
      });
      listTransferEvent = listTransferEvent?.map((event: any) => ({
        blockNumber: event?.blockNumber,
        blockHash: event?.blockHash,
        blockTime: event?.blockTime,
        txHash: event?.txHash,
        lpToken: event?.token,
        lpDecimals: event?.decimals,
        from: event?.from,
        to: event?.to,
        amount: event?.amount,
        chain: CHAIN.BSC,
        token0: mapOfPool[event?.token]?.token0,
        token1: mapOfPool[event?.token]?.token1,
      }));

      console.log("currentStep", currentStep, listTransferEvent.length);

      await createTransferEvent(listTransferEvent);
      currentStep += batchSize;
    }
  } catch (error: any) {
    console.log("getTransferEvent error:", error);
  }
};

const getListPoolInfo = async (listToken: string[]) => {
  try {
    if (listToken?.length === 0) {
      return [];
    }

    let currentStep = 0;
    const batchSize = 10;
    const totalStep = Math.round(listToken.length / batchSize);
    let listPoolInfo: any = [];

    while (currentStep < totalStep) {
      const params = listToken.slice(
        currentStep * batchSize,
        (currentStep + 1) * batchSize
      );
      if (params.length > 0) {
        const res = await contractInfoAxios.get(
          `/pool/bsc?addresses=${params.join(",")}`
        );

        if (res?.data?.length > 0) {
          listPoolInfo = [...listPoolInfo, ...res?.data];
        }
      }

      currentStep += 1;
    }

    listPoolInfo = listPoolInfo?.filter(
      (pool: any) =>
        pool?.token0?.address !== BAD_TOKEN &&
        pool?.token1?.address !== BAD_TOKEN
    );
    return listPoolInfo;
  } catch (error: any) {
    console.log("getPoolInfo error:", error);
  }
};

const formatTokenAddress = (address: string) => address?.toLowerCase();

const getPoolInfo = async (poolAddress: string) => {
  try {
    const res = await contractInfoAxios.get(
      `/pool/bsc?addresses=${poolAddress}`
    );
    return res?.data;
  } catch (error: any) {
    console.log("getPoolInfo error:", error);
  }
};

export { getTransferEvent, getPoolInfo, getListPoolInfo };
