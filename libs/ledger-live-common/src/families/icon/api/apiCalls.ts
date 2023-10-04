import network from "@ledgerhq/live-network/network";
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
  const resp = await network({
    method: "GET",
    url: `${url}/addresses/details/${addr.toString()}`,
  });
  const { status, data } = resp;
  let balance = 0;
  if (data?.balance) {
    balance = data?.balance;
  }
  if (status !== 200) {
    throw Error("Cannot get account details");
  }
  return {
    balance,
  };
};

export const getLatestBlock = async (url: string) => {
  const resp = await network({
    method: "GET",
    url: `${url}/blocks`,
  });
  const { status, data } = resp;
  let blockHeight = null;

  blockHeight = data[0]?.number;

  if (status !== 200) {
    throw Error("Cannot get account details");
  }
  return blockHeight;
};

export const getHistory = async (
  addr: string,
  skip: number,
  url: string
) => {
  const limit = LIMIT;
  const result = await network({
    method: "GET",
    url: `${url}/transactions/address/${addr}?address=${addr}&skip=${skip}&limit=${limit}`,
  });
  const { data: respData } = result;
  if (!respData) {
    return [];
  }


  let allTransactions = [...respData];
  if (limit == allTransactions.length) {
    while (limit == allTransactions.length) {
      skip += limit;
      const { data: res } = await network({
        method: "GET",
        url: `${url}/transactions/address/${addr}?address=${addr}&skip=${skip}&limit=${limit}`,
      });

      allTransactions = [...allTransactions, ...(res || [])];
    }
  }

  return allTransactions;
};
