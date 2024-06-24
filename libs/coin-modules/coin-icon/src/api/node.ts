import { BigNumber } from "bignumber.js";
import IconService from "icon-sdk-js";
import type { IcxTransaction, SignedTransaction } from "icon-sdk-js";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { isTestnet } from "../logic";
import { GOVERNANCE_SCORE_ADDRESS, IISS_SCORE_ADDRESS } from "../constants";
import { IconAccount } from "../types/index";
import { SignedOperation } from "@ledgerhq/types-live";
import { IconDelegationType } from "./api-type";
import { getCoinConfig } from "../config";

const { HttpProvider } = IconService;
const { IconBuilder } = IconService;

/**
 * Returns Testnet RPC URL if the current currency is testnet
 * @param {currency} currency
 */
export function getRpcUrl(currency: CryptoCurrency): string {
  const currencyConfig = getCoinConfig();
  let rpcUrl = currencyConfig.infra.node_endpoint;
  if (isTestnet(currency)) {
    rpcUrl = currencyConfig.infra.node_testnet_endpoint;
  }
  return rpcUrl;
}

export function getDebugRpcUrl(currency: CryptoCurrency): string {
  const currencyConfig = getCoinConfig();
  let rpcUrl = currencyConfig.infra.debug_endpoint;
  if (isTestnet(currency)) {
    rpcUrl = currencyConfig.infra.debug_testnet_endpoint;
  }
  return rpcUrl;
}

/**
 * Broadcast blob to blockchain
 */
export const broadcastTransaction = async (
  signedOperation: SignedOperation,
  currency: CryptoCurrency,
) => {
  const { hash } = await submit(signedOperation, currency);
  return { hash };
};

export const submit = async (signedOperation: SignedOperation, currency: CryptoCurrency) => {
  const rpcURL = getRpcUrl(currency);

  const httpProvider = new HttpProvider(rpcURL);
  const iconService = new IconService(httpProvider);

  const signedTransaction = {
    getProperties: () => signedOperation.rawData,
    getSignature: () => signedOperation.signature,
  };

  const response = await iconService
    .sendTransaction(signedTransaction as SignedTransaction)
    .execute();
  return {
    hash: response,
  };
};

/**
 * Obtain fees from blockchain
 */
export const getFees = async (
  unsigned: IcxTransaction,
  account: IconAccount,
): Promise<BigNumber> => {
  const debugRpcUrl = getDebugRpcUrl(account.currency);
  const httpProvider = new HttpProvider(debugRpcUrl);
  const iconService = new IconService(httpProvider);
  const res = await iconService.estimateStep(unsigned).execute();
  return new BigNumber(res);
};

/**
 * Get step price from governance contract
 */
export const getStepPrice = async (account: IconAccount): Promise<BigNumber> => {
  const rpcURL = getRpcUrl(account.currency);
  const httpProvider = new HttpProvider(rpcURL);
  const iconService = new IconService(httpProvider);
  const txBuilder = new IconBuilder.CallBuilder();
  const stepPriceTx = txBuilder.to(GOVERNANCE_SCORE_ADDRESS).method("getStepPrice").build();
  const res = await iconService.call(stepPriceTx).execute();
  return new BigNumber(res);
};

export const getDelegation = async (
  address: string,
  currency: CryptoCurrency,
): Promise<IconDelegationType> => {
  const rpcURL = getRpcUrl(currency);
  const httpProvider = new HttpProvider(rpcURL);
  const iconService = new IconService(httpProvider);
  const delegationTx = new IconBuilder.CallBuilder()
    .to(IISS_SCORE_ADDRESS)
    .method("getDelegation")
    .params({
      address,
    })
    .build();

  const res = await iconService.call(delegationTx).execute();
  return {
    delegations: res.delegations,
    totalDelegated: new BigNumber(res.totalDelegated),
    votingPower: new BigNumber(res.votingPower),
  };
};
