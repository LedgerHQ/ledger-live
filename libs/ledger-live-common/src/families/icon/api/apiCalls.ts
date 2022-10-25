import network from "../../../network";
import IconService from "icon-sdk-js";
import { LIMIT } from "../constants";
import { getRpcUrl } from "../logic";
const { HttpProvider } = IconService;

export const submit = async (txObj, currency) => {
  const rpcURL = getRpcUrl(currency);

  const httpProvider = new HttpProvider(rpcURL);
  const iconService = new IconService(httpProvider);

  const signedTransaction: any = {
    getProperties: () => txObj.rawTransaction,
    getSignature: () => txObj.signature,
  };

  const response = await iconService
    .sendTransaction(signedTransaction)
    .execute();
  return {
    hash: response,
  };
};

export const getAccountDetails = async (addr: string, url: string) => {
  const reps = await network({
    method: "GET",
    url: `${url}/address/info?address=${addr.toString()}`,
  });
  const { status, data } = reps;
  let balance = 0;
  if (data?.data?.balance) {
    balance = data?.data?.balance;
  }
  if (status !== 200) {
    throw Error("Cannot get account details");
  }
  return {
    balance,
  };
};

export const getLatestBlock = async (url: string) => {
  //berlin.tracker.solidwallet.io/v3/block/list?page=1&count=1
  const reps = await network({
    method: "GET",
    url: `${url}/block/list?page=1&count=1`,
  });

  const { status, data } = reps;
  let blockHeight = null;

  blockHeight = data?.data[0]?.height;

  if (status !== 200) {
    throw Error("Cannot get account details");
  }
  return blockHeight;
};

export const getHistory = async (
  addr: string,
  startAt: number,
  url: string
) => {
  const limit = LIMIT;
  const result = await network({
    method: "GET",
    url: `${url}/address/txList?address=${addr}&page=${startAt}&count=${limit}`,
  });
  const { data } = result;
  if (!data?.data) {
    return [];
  }
  const { data: respData, totalSize } = data;

  let allTransactions = [...respData];
  let offset = startAt * limit;
  if (totalSize > allTransactions.length) {
    while (offset <= totalSize) {
      startAt++;
      const { data: res } = await network({
        method: "GET",
        url: `${url}/address/txList?address=${addr}&page=${startAt}&count=${limit}`,
      });

      allTransactions = [...allTransactions, ...(res?.data || [])];

      offset = startAt * limit;
    }
  }

  return allTransactions;
};
