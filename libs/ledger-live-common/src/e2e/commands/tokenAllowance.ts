import { BigNumber } from "bignumber.js";
import type { Account, DerivationMode } from "@ledgerhq/types-live";
import {
  asDerivationMode,
  getDerivationScheme,
  runDerivationScheme,
} from "@ledgerhq/ledger-wallet-framework/derivation";
import { getEvmTokenAllowance } from "../../families/evm/getTokenAllowance";
import { decodeAccountId, emptyHistoryCache, encodeAccountId } from "../../account/index";
import { findCryptoCurrencyByKeyword, getCryptoCurrencyById } from "../../currencies/index";
import type { GetTokenAllowanceOpts } from "./types";

function buildMinimalEvmAccount(params: {
  currencyId: string;
  address: string;
  derivationMode: DerivationMode;
  index: number;
}): Account {
  const { currencyId, address, derivationMode, index } = params;
  const id = encodeAccountId({
    type: "js",
    version: "2",
    currencyId,
    xpubOrAddress: address.trim(),
    derivationMode,
  });
  const { derivationMode: dm, xpubOrAddress, currencyId: decodedCurrencyId } = decodeAccountId(id);
  const currency = getCryptoCurrencyById(decodedCurrencyId);
  const resolvedDerivationMode = asDerivationMode(dm);
  const derivationScheme = getDerivationScheme({
    derivationMode: resolvedDerivationMode,
    currency,
  });
  const freshAddressPath = runDerivationScheme(derivationScheme, currency, {
    account: index,
    node: 0,
    address: 0,
  });

  return {
    type: "Account",
    xpub: xpubOrAddress,
    seedIdentifier: xpubOrAddress,
    used: true,
    swapHistory: [],
    id,
    derivationMode: resolvedDerivationMode,
    currency,
    index,
    freshAddress: xpubOrAddress,
    freshAddressPath,
    creationDate: new Date(),
    lastSyncDate: new Date(0),
    blockHeight: 0,
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    balanceHistoryCache: emptyHistoryCache,
  };
}

// Returns the same JSON string the CLI printed, so existing parsing is unchanged.
export async function cmdGetTokenAllowance(opts: GetTokenAllowanceOpts): Promise<string> {
  const currency = findCryptoCurrencyByKeyword(opts.currency);
  if (!currency) throw new Error(`Unknown currency: ${opts.currency}`);
  if (currency.family !== "evm") {
    throw new Error(`tokenAllowance only supports EVM chains. Got family ${currency.family}.`);
  }

  const index =
    typeof opts.index === "number" ? opts.index : Number.parseInt(String(opts.index), 10);

  const mainAccount = buildMinimalEvmAccount({
    currencyId: currency.id,
    address: opts.ownerAddress,
    derivationMode: asDerivationMode(""),
    index: Number.isFinite(index) ? index : 0,
  });

  const result = await getEvmTokenAllowance(mainAccount, opts.token, opts.spenderAddress);

  return JSON.stringify({
    allowance: result.allowance.toFixed(0),
    unitMagnitude: result.unit.magnitude,
    symbol: result.symbol,
    tokenId: result.tokenId,
    owner: result.owner,
    spender: result.spender,
    contractAddress: result.contractAddress,
  });
}
