import _ from "lodash";
import { findManyTransferEvent } from "@/service/transferEvent";
import { getReserveInPool } from "@/service/web3";
import TransferEvent from "@/model/transferEvent";
import { coinGekoAxios, getPoolInfo } from "@/service/logWarehouse";

export const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const getWalletTrxHistory = async (
  poolAddress: string,
  walletAddress: string
) => {
  try {
    let listTransaction: any = await getListTransactionInPool(
      poolAddress,
      walletAddress
    );
    const poolInfo = await getPoolInfo(poolAddress);

    listTransaction = JSON.parse(JSON.stringify(listTransaction));

    const listSnapShot: any[] = [];
    const listTokenSnapshot: any[] = [];

    // just take few data to test
    listTransaction.deposit = listTransaction?.deposit?.slice(0, 5);
    listTransaction.withdraw = listTransaction?.withdraw?.slice(0, 5);

    [...listTransaction?.deposit, ...listTransaction?.withdraw]?.forEach(
      (transaction: any) => {
        const lpTokenSnapshot = {
          blockNumber: transaction?.blockNumber,
          lpToken: transaction?.lpToken,
        };
        const token0Snapshot = {
          blockTime: transaction?.blockTime,
          blockNumber: transaction?.blockNumber,
          token: transaction?.token0?.address,
        };
        const token1Snapshot = {
          blockTime: transaction?.blockTime,
          blockNumber: transaction?.blockNumber,
          token: transaction?.token1?.address,
        };

        if (!_.find(listTokenSnapshot, token0Snapshot)) {
          listTokenSnapshot.push(token0Snapshot);
        }

        if (!_.find(listTokenSnapshot, token1Snapshot)) {
          listTokenSnapshot.push(token1Snapshot);
        }

        if (!_.find(listSnapShot, lpTokenSnapshot)) {
          listSnapShot.push(lpTokenSnapshot);
        }
      }
    );

    const listPriceBySnapshot: any = await getTokenPriceByBlockTime(
      listTokenSnapshot
    );

    // get reserve and total supply
    const listReserveSnapshot: any[] = [];
    for (let i = 0; i < listSnapShot.length; i++) {
      const snapshot = listSnapShot[i];

      const historyReserve: any = await getReserveInPool(
        snapshot?.lpToken,
        snapshot?.blockNumber
      );
      const currentReserve: any = await getReserveInPool(snapshot?.lpToken);

      listReserveSnapshot.push({
        ...snapshot,
        reserve0: historyReserve?.reserve0,
        reserve1: historyReserve?.reserve1,
        totalSupply: historyReserve?.totalSupply,
        currentReserve0: currentReserve?.reserve0,
        currentReserve1: currentReserve?.reserve1,
        currentTotalSupply: currentReserve?.totalSupply,
      });
    }

    listTransaction.deposit = processTransactionInfo(
      listTransaction.deposit,
      listReserveSnapshot,
      listPriceBySnapshot,
      poolInfo[0]
    );
    listTransaction.withdraw = processTransactionInfo(
      listTransaction.withdraw,
      listReserveSnapshot,
      listPriceBySnapshot,
      poolInfo[0]
    );

    return listTransaction;
  } catch (error: any) {
    console.log("getPNLOfTokenInPool", error);
  }
};

const getPoolPNLOfWallet = async (walletAddress: any, poolAddress: any) => {
  try {
    const poolInfo = await getPoolInfo(poolAddress);
    const listTransaction = await getWalletTrxHistory(
      poolAddress,
      walletAddress
    );
    const listDeposit = listTransaction?.deposit;
    const token0Address = listDeposit?.[0]?.token0?.address;
    const token1Address = listDeposit?.[0]?.token1?.address;
    const token0CurrentPrice = listDeposit?.[0]?.token0?.token0CurrentPrice;
    const token1CurrentPrice = listDeposit?.[0]?.token1?.token1CurrentPrice;

    let currentBalance0 = 0;
    listDeposit?.forEach((trx: any) => {
      if (trx?.token0?.address === token0Address) {
        currentBalance0 += Number(trx?.token0?.depositAmount);
      }
    });

    let currentFiatBalance0 = 0;
    listDeposit?.forEach((trx: any) => {
      if (trx?.token0?.address === token0Address) {
        currentFiatBalance0 += Number(trx?.token0?.currentFiatBalance);
      }
    });

    let depositAmount0 = 0;
    listDeposit?.forEach((trx: any) => {
      if (trx?.token0?.address === token0Address) {
        depositAmount0 += Number(trx?.token0?.depositAmount);
      }
    });

    let depositFiatAmount0 = 0;
    listDeposit?.forEach((trx: any) => {
      if (trx?.token0?.address === token0Address) {
        depositFiatAmount0 += Number(trx?.token0?.depositFiatAmount);
      }
    });

    let currentBalance1 = 0;
    listDeposit?.forEach((trx: any) => {
      if (trx?.token1?.address === token1Address) {
        currentBalance1 += Number(trx?.token1?.depositAmount);
      }
    });

    let currentFiatBalance1 = 0;
    listDeposit?.forEach((trx: any) => {
      if (trx?.token1?.address === token1Address) {
        currentFiatBalance1 += Number(trx?.token1?.currentFiatBalance);
      }
    });

    let depositAmount1 = 0;
    listDeposit?.forEach((trx: any) => {
      if (trx?.token1?.address === token1Address) {
        depositAmount1 += Number(trx?.token1?.depositFiatAmount);
      }
    });

    let depositFiatAmount1 = 0;
    listDeposit?.forEach((trx: any) => {
      if (trx?.token1?.address === token1Address) {
        depositFiatAmount1 += Number(trx?.token1?.depositFiatAmount);
      }
    });

    const token0 = {
      token: {
        address: token0Address,
        symbol: listDeposit?.[0]?.token0?.symbol,
        name: listDeposit?.[0]?.token0?.name,
        logo: "",
      },
      depositAmount: depositAmount0,
      depositFiatAmount: depositFiatAmount0,
      currentBalance: currentBalance0,
      currentFiatBalance: currentFiatBalance0,
      previouAmount: 0,
      previouFiatAmount: 0,
      gainAmount: 200,
      gainFiatAmount:
        currentFiatBalance0 > 0
          ? String((currentBalance0 / currentFiatBalance0) * 200)
          : 100,
    };
    const token1 = {
      token: {
        address: token1Address,
        symbol: listDeposit?.[0]?.token1?.symbol,
        name: listDeposit?.[0]?.token1?.name,
      },
      depositAmount: depositAmount1,
      depositFiatAmount: depositFiatAmount1,
      currentBalance: currentBalance1,
      currentFiatBalance: currentFiatBalance1,
      previouAmount: 0,
      previouFiatAmount: 0,
      gainAmount: 300,
      gainFiatAmount:
        currentFiatBalance1 > 0
          ? String((currentBalance1 / currentFiatBalance1) * 300)
          : 150,
    };

    const amount = token0?.currentFiatBalance + token1?.currentFiatBalance;

    const res = {
      poolInfo: poolInfo[0],
      amount,
      imploss:
        (token0.currentBalance - token0.depositAmount) * token0CurrentPrice +
        (token1.currentBalance - token1.depositAmount) * token1CurrentPrice,
      pnl:
        token0?.currentFiatBalance -
        token0?.depositFiatAmount +
        token1?.currentFiatBalance -
        token0?.depositFiatAmount,
      token0,
      token1,
      reward: 20,
      rewardUSD: 40,
    };

    return res;
  } catch (error: any) {
    console.log("getListPoolOfAddress", error);
  }
};

const getListTransactionInPool = async (
  poolAddress: string,
  walletAddress: string
) => {
  try {
    const listDepositLpTokenEvent = await findManyTransferEvent({
      lpToken: poolAddress,
      to: walletAddress,
    });

    const listWithdrawLPTokenEvent = await findManyTransferEvent({
      lpToken: poolAddress,
      from: walletAddress,
    });

    return {
      deposit: listDepositLpTokenEvent,
      withdraw: listWithdrawLPTokenEvent,
    };
  } catch (error: any) {
    console.log("getListTransactionInPool", error);
  }
};

const getListDemoWallet = async () => {
  try {
    const listData = await TransferEvent.aggregate([
      {
        $group: {
          _id: { to: "$to", lpToken: "$lpToken" },
          count: { $sum: 1 },
        },
      },
      { $match: { count: { $gt: 1 } } },
      { $sort: { count: -1 } },
    ]);

    console.log("listData", listData);
  } catch (error: any) {
    console.log("getListDemoWallet", error);
  }
};

const processTransactionInfo = (
  listTransaction: any[],
  listSnapshot: any[],
  listPriceBySnapshot: any[],
  poolInfo: any
) => {
  return listTransaction?.map((transaction: any) => {
    if (
      transaction?.token0?.depositAmount &&
      transaction?.token0?.depositFiatAmount
    ) {
      return transaction;
    } else {
      const reserveInfo = _.find(listSnapshot, {
        blockNumber: transaction?.blockNumber,
        lpToken: transaction?.lpToken,
      });
      const historyPercentage =
        Number(transaction?.amount) / Number(reserveInfo?.totalSupply);
      const currentPercentage =
        Number(transaction?.amount) / Number(reserveInfo?.currentTotalSupply);

      const token0Price =
        _.find(listPriceBySnapshot, {
          blockNumber: transaction?.blockNumber,
          token: transaction?.token0?.address,
        })?.price || 0;
      const token0CurrentPrice =
        _.find(listPriceBySnapshot, {
          isCurrentPrice: true,
          token: transaction?.token0?.address,
        })?.price || 0;

      const token1Price =
        _.find(listPriceBySnapshot, {
          blockNumber: transaction?.blockNumber,
          token: transaction?.token1?.address,
        })?.price || 0;
      const token1CurrentPrice =
        _.find(listPriceBySnapshot, {
          isCurrentPrice: true,
          token: transaction?.token1?.address,
        })?.price || 0;

      const depositAmount0 =
        Math.round(Number(reserveInfo?.reserve0) * historyPercentage) /
        Math.pow(10, poolInfo?.token0?.decimals);
      const currentBalance0 =
        Math.round(Number(reserveInfo?.currentReserve0) * currentPercentage) /
        Math.pow(10, poolInfo?.token0?.decimals);

      const depositAmount1 =
        Math.round(Number(reserveInfo?.reserve1) * historyPercentage) /
        Math.pow(10, poolInfo?.token0?.decimals);
      const currentBalance1 =
        Math.round(Number(reserveInfo?.currentReserve1) * currentPercentage) /
        Math.pow(10, poolInfo?.token0?.decimals);

      return {
        ...transaction,
        token0: {
          ...transaction.token0,
          depositAmount: depositAmount0,
          depositFiatAmount: token0Price * depositAmount0,
          token0CurrentPrice,
          currentBalance: currentBalance0,
          currentFiatBalance: currentBalance0 * token0CurrentPrice,
        },
        token1: {
          ...transaction.token1,
          depositAmount: depositAmount1,
          depositFiatAmount: token1Price * depositAmount1,
          token1CurrentPrice,
          currentBalance: currentBalance1,
          currentFiatBalance: currentBalance1 * token1CurrentPrice,
        },
        shouldUpdate: true,
      };
    }
  });
};

const getPriceOfToken = async (contractAddress: any, from: any, to: any) => {
  try {
    const res = await coinGekoAxios?.get(
      `/contract/${contractAddress}/market_chart/range?vs_currency=usd&from=${from}&to=${to}`
    );
    const listPrice = res?.data?.prices;
    return listPrice?.[0]?.[1];
  } catch (error: any) {
    console.log("getPriceOfToken error:", error?.message);
  }
};

const getTokenPriceByBlockTime = async (listToken: any[]) => {
  try {
    const listEnhanceToken = [
      ...listToken,
      ...listToken.map((token: any) => ({
        ...token,
        blockTime: Math.round(new Date().getTime() / 1000 - 10000),
        isCurrentPrice: true,
      })),
    ];

    let listPrice: any[] = [];
    for (let i = 0; i < listEnhanceToken.length; i++) {
      const price = await getPriceOfToken(
        listEnhanceToken[i]?.token,
        listEnhanceToken[i]?.blockTime - 1000,
        listEnhanceToken[i]?.blockTime + 1000
      );
      listPrice.push({
        ...listEnhanceToken[i],
        price,
      });
      await sleep(1000);
    }

    return listPrice?.filter((item: any) => item?.price !== undefined);
  } catch (error: any) {
    console.log("getTokenPriceByBlockNumber error:", error);
  }
};

const getListPoolOfWallet = async (wallet: any) => {
  try {
    const listTraction = await findManyTransferEvent({
      to: wallet,
    });
    let listPool = listTraction?.map((trx: any) => trx?.lpToken);
    listPool = _.uniq(listPool);
    listPool = listPool?.slice(0, 5);
    console.log("listPool", listPool);

    const listData: any[] = [];
    for (let i = 0; i < listPool?.length; i++) {
      const poolInfo = await getPoolPNLOfWallet(wallet, listPool[i]);
      listData.push(poolInfo);
    }

    return listData;
  } catch (error: any) {
    console.log("getListPoolOfWallet", error);
  }
};

export {
  getWalletTrxHistory,
  getPoolPNLOfWallet,
  getListTransactionInPool,
  getListDemoWallet,
  getPriceOfToken,
  getListPoolOfWallet,
};
