import { BigNumber } from "bignumber.js";
import IconService from "icon-sdk-js";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getEnv } from "@ledgerhq/live-env";
import { isTestnet } from "../logic";
import { GOVERNANCE_SCORE_ADDRESS, IISS_SCORE_ADDRESS, STEP_LIMIT } from "../constants";

const { HttpProvider } = IconService;
const { IconBuilder, IconAmount } = IconService;
const iconUnit = IconAmount.Unit.ICX.toString();

/**
 * Returns Testnet RPC URL if the current currency is testnet
 *
 * @param {currency} CryptoCurrency
 */
export function getRpcUrl(currency: CryptoCurrency): string {
  let rpcUrl = getEnv("ICON_NODE_ENDPOINT");
  if (isTestnet(currency)) {
    rpcUrl = getEnv("ICON_TESTNET_NODE_ENDPOINT");
  }
  return rpcUrl;
}

/**
 * Broadcast blob to blockchain
 */
export const broadcastTransaction = async (transaction, currency) => {
  const { hash } = await submit(transaction, currency);
  // Transaction hash is likely to be returned
  return { hash };
};

export const submit = async (txObj, currency) => {
  const rpcURL = getRpcUrl(currency);

  const httpProvider = new HttpProvider(rpcURL);
  const iconService = new IconService(httpProvider);

  const signedTransaction: any = {
    getProperties: () => txObj.rawData,
    getSignature: () => txObj.signature,
  };

  const response = await iconService.sendTransaction(signedTransaction).execute();
  return {
    hash: response,
  };
};

/**
 * Obtain fees from blockchain
 */
export const getFees = async (unsigned, account): Promise<BigNumber> => {
  const rpcURL = getRpcUrl(account.currency);
  // d mean debug, only get estimate step with debug enpoint
  const debugRpcUrl = rpcURL + "d";
  const httpProvider = new HttpProvider(debugRpcUrl);
  const iconService = new IconService(httpProvider);
  let res;
  try {
    res = await iconService.estimateStep(unsigned).execute();
  } catch (error) {
    // TODO: handle show log
  }
  return new BigNumber(res || STEP_LIMIT);
};

/**
 * Get step price from governance contract
 */
export const getStepPrice = async (account): Promise<BigNumber> => {
  const rpcURL = getRpcUrl(account.currency);
  const httpProvider = new HttpProvider(rpcURL);
  const iconService = new IconService(httpProvider);
  const txBuilder: any = new IconBuilder.CallBuilder();
  const stepPriceTx = txBuilder.to(GOVERNANCE_SCORE_ADDRESS).method("getStepPrice").build();
  let res;
  try {
    res = await iconService.call(stepPriceTx).execute();
  } catch (error) {
    // TODO: handle show log
  }
  return new BigNumber(IconAmount.fromLoop(res || 10000000000, iconUnit));
};

export const getDelegation = async (address, currency) => {
  const rpcURL = getRpcUrl(currency);
  const httpProvider = new HttpProvider(rpcURL);
  const iconService = new IconService(httpProvider);
  const delegationTx: any = new IconBuilder.CallBuilder()
    .to(IISS_SCORE_ADDRESS)
    .method("getDelegation")
    .params({
      address,
    })
    .build();

  let res;

  try {
    res = await iconService.call(delegationTx).execute();
  } catch (error) {
    // TODO: handle show log
    console.log(error);
  }
  return {
    delegations:
      res?.delegations.map(item => {
        return { ...item, value: new BigNumber(IconAmount.fromLoop(item.value || 0, iconUnit)) };
      }) || [],
    totalDelegated: new BigNumber(IconAmount.fromLoop(res?.totalDelegated || 0, iconUnit)),
    votingPower: new BigNumber(IconAmount.fromLoop(res?.votingPower || 0, iconUnit)),
  };
};
