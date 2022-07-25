import BigNumber from "bignumber.js";
import { fetch } from "./sdk";
import { Account, AccountHTTP } from "./sdk.types";
import { CryptoCurrency } from "@ledgerhq/cryptoassets";
import { endpointByCurrencyId } from "../utils";
import { getValidators } from "./sdk-getValidators";

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

  const validators = await getValidators(currency, address);

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
    address: account.address,
    validators,
  };
};

export default getAccount;
