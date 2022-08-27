import BigNumber from "bignumber.js";
import { fetch } from "./sdk";
import { Account, AccountHTTP } from "./sdk.types";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { endpointByCurrencyId } from "../utils";

/**
 * Get account balances and nonce.
 * @param address
 * @returns
 */
const getAccount = async (
  address: string,
  currency: CryptoCurrency
): Promise<Account> => {
  const rootUrl = endpointByCurrencyId(currency.id);

  const { data: account }: { data: AccountHTTP } = await fetch(
    `${rootUrl}/accounts/${address}`
  );

  return {
    stakedBalance: new BigNumber(account.staked_balance),
    speculativeSecNonce: account.speculative_sec_nonce,
    speculativeNonce: account.speculative_nonce,
    secNonce: account.sec_nonce,
    secBalance: new BigNumber(account.sec_balance),
    nonce: account.nonce,
    dcNonce: account.dc_nonce,
    dcBalance: new BigNumber(account.dc_balance),
    blockHeight: account.block,
    balance: new BigNumber(account.balance),
    iotBalance: new BigNumber(account.iot_balance || 0),
    mobileBalance: new BigNumber(account.mobile_balance || 0),
    address: account.address,
    validators: [],
  };
};

export default getAccount;
