// FIXME there are two tradeoffs and problems to solve
// - first of all, compound api is not that fast and we are not optimized by pulling for each trade
// - secondly, we need to implement the "historical over time" changes.
// IDEA: to me we need to reborn the idea that we will pull daily rates and just stick to it (even if it means some approximation)
import URL from "url";
import { log } from "@ledgerhq/logs";
import invariant from "invariant";
import { BigNumber } from "bignumber.js";
import abi from "ethereumjs-abi";
import values from "lodash/values";
import { NotEnoughBalance, AmountRequired } from "@ledgerhq/errors";
import type { TokenAccount, OperationType } from "@ledgerhq/types-live";
import type { ModeModule } from "../types";
import {
  getTokenById,
  findCompoundToken,
  formatCurrencyUnit,
} from "../../../currencies";
import { emptyHistoryCache } from "../../../account";
import network from "../../../network";
import { promiseAllBatched } from "../../../promise";
import { mergeOps } from "../../../bridge/jsHelpers";
import { apiForCurrency } from "../../../api/Ethereum";
import { inferTokenAccount } from "../transaction";
import { getEnv } from "../../../env";
import { DeviceTransactionField } from "../../../transaction";
import type {
  CryptoCurrency,
  TokenCurrency,
} from "@ledgerhq/types-cryptoassets";
// global state that exists when compound is loaded
let compoundPreloadedValue: CurrentRate[] | null | undefined;
const compoundWhitelist = [
  "ethereum/erc20/compound_dai",
  "ethereum/erc20/compound_usd_coin",
  "ethereum/erc20/compound_usdt",
];
export function listSupportedCompoundTokens(): TokenCurrency[] {
  return compoundWhitelist.map(getTokenById);
}
export function isCompoundTokenSupported(token: TokenCurrency): boolean {
  return compoundWhitelist.includes(token.id);
}
export function getEnabledAmount(account: TokenAccount): BigNumber {
  const ctoken = findCompoundToken(account.token);
  const approval =
    ctoken &&
    (account.approvals || []).find(
      (a) => a.sender.toLowerCase() === ctoken.contractAddress.toLowerCase()
    );
  return approval ? new BigNumber(approval.value) : new BigNumber(0);
}
export function getSupplyMax(a: TokenAccount): BigNumber {
  return BigNumber.min(a.spendableBalance, getEnabledAmount(a));
}
export type Modes = "compound.supply" | "compound.withdraw";

function contractField(ctoken: TokenCurrency) {
  const token = getTokenById(ctoken.compoundFor || "");
  return {
    type: "text",
    label: "Contract",
    value: "Compound " + token.ticker,
  };
}

/**
 * "compound.supply" will allocate some compound underlying funds (e.g. DAI) into the compound token (e.g. CDAI)
 * transaction params:
 * - transaction.amount is the supplied amount in underlying unit (e.g. DAI not CDAI). range: ]0, spendableBalance]
 * (NB: transaction.useAllAmount is NOT used. just set amount yourself)
 */
const compoundSupply: ModeModule = {
  fillTransactionStatus(a, t, result) {
    const subAccount = inferTokenAccount(a, t);
    invariant(subAccount, "sub account missing");
    // FIXME: make sure it doesn't break
    if (!subAccount) throw new Error("sub account missing");

    if (t.amount.eq(0)) {
      result.errors.amount = new AmountRequired();
    } else if (t.amount.gt(getSupplyMax(subAccount))) {
      result.errors.amount = new NotEnoughBalance();
    }

    result.amount = t.amount;
  },

  fillTransactionData(a, t, tx) {
    const subAccount = inferTokenAccount(a, t);
    invariant(subAccount, "sub account missing");
    // FIXME: make sure it doesn't break
    if (!subAccount) throw new Error("sub account missing");
    const cToken = findCompoundToken(subAccount.token);
    invariant(cToken, "is not a compound supported token");
    if (!cToken) throw new Error("is not a compound supported token");
    invariant(t.amount, "amount missing");
    const amount = new BigNumber(t.amount);
    const data = abi.simpleEncode("mint(uint256)", amount.toString(10));
    tx.data = "0x" + data.toString("hex");
    tx.to = cToken.contractAddress;
    tx.value = "0x00";
  },

  fillDeviceTransactionConfig({ transaction, account }, fields) {
    invariant(account.type === "TokenAccount", "token account expected");
    if (account.type !== "TokenAccount") {
      throw new Error("token account expected");
    }
    const ctoken = findCompoundToken(account.token);
    invariant(ctoken, "is not a compound supported token");
    // FIXME: make sure it doesn't break
    if (!ctoken) throw new Error("is not a compound supported token");
    fields.push({
      type: "text",
      label: "Type",
      value: "Lend Assets",
    });
    fields.push({
      type: "text",
      label: "Amount",
      value: formatCurrencyUnit(account.token.units[0], transaction.amount, {
        showCode: true,
        disableRounding: true,
      }),
    });
    fields.push(contractField(ctoken) as DeviceTransactionField);
  },

  fillOptimisticOperation(a, t, op) {
    op.type = "FEES";
    const subAccount = inferTokenAccount(a, t);

    if (subAccount) {
      const currentRate = findCurrentRate(subAccount.token);
      const rate = currentRate ? currentRate.rate : new BigNumber(0);
      const value = new BigNumber(t.amount || 0);
      const compoundValue = value.div(rate).integerValue();
      // ERC20 transfer
      op.subOperations = [
        {
          id: `${subAccount.id}-${op.hash}-SUPPLY`,
          hash: op.hash,
          transactionSequenceNumber: op.transactionSequenceNumber,
          type: "SUPPLY",
          value,
          fee: op.fee,
          blockHash: null,
          blockHeight: null,
          senders: op.senders,
          recipients: op.recipients,
          accountId: subAccount.id,
          date: new Date(),
          extra: {
            compoundValue: compoundValue.toString(10),
            rate: rate.toString(10),
          },
        },
      ];
    }
  },

  getResolutionConfig: () => ({ erc20: true, externalPlugins: true }),
};

/**
 * "compound.withdraw" will take back some previously supplied compound tokens back into the underlying asset (e.g. transforming CDAI back into DAI, getting the accumulated profits)
 * transaction params:
 * - transaction.amount in underlying unit (expressed in DAI not CDAI). range: ]0, balance-spendableBalance]
 * - transaction.useAllAmount MUST BE USED in the intend to withdraw all. it will use a different contract method.
 */
const compoundWithdraw: ModeModule = {
  fillTransactionStatus(a, t, result) {
    const subAccount = inferTokenAccount(a, t);
    invariant(subAccount, "sub account missing");
    // FIXME: make sure it doesn't break
    if (!subAccount) throw new Error("sub account missing");
    const nonSpendableBalance = subAccount.balance.minus(
      subAccount.spendableBalance
    );
    const { compoundBalance } = subAccount;
    invariant(compoundBalance, "missing compoundBalance");
    // FIXME: make sure it doesn't break
    if (!compoundBalance) throw new Error("missing compoundBalance");

    if (
      compoundBalance.eq(0) ||
      (!t.useAllAmount && t.amount.gt(nonSpendableBalance))
    ) {
      result.errors.amount = new NotEnoughBalance();
    }

    result.amount = t.useAllAmount ? compoundBalance : t.amount;
  },

  fillTransactionData(a, t, tx) {
    const subAccount = inferTokenAccount(a, t);
    invariant(subAccount, "sub account missing");
    // FIXME: make sure it doesn't break
    if (!subAccount) throw new Error("sub account missing");
    const cToken = findCompoundToken(subAccount.token);
    invariant(cToken, "is not a compound supported token");
    // FIXME: make sure it doesn't break
    if (!cToken) throw new Error("is not a compound supported token");
    const data = t.useAllAmount
      ? abi.simpleEncode(
          "redeem(uint256)",
          subAccount.compoundBalance?.toString(10)
        )
      : abi.simpleEncode(
          "redeemUnderlying(uint256)",
          (invariant(t.amount, "amount missing"),
          new BigNumber(t.amount).toString(10))
        );
    tx.data = "0x" + data.toString("hex");
    tx.value = "0x00";
    tx.to = cToken.contractAddress;
  },

  fillDeviceTransactionConfig({ transaction, account }, fields) {
    invariant(account.type === "TokenAccount", "token account expected");
    // FIXME: make sure it doesn't break
    if (account.type !== "TokenAccount") {
      throw new Error("token account expected");
    }
    const ctoken = findCompoundToken(account.token);
    invariant(ctoken, "is not a compound supported token");
    // FIXME: make sure it doesn't break
    if (!ctoken) throw new Error("is not a compound supported token");
    fields.push({
      type: "text",
      label: "Type",
      value: "Redeem Assets",
    });
    const value = transaction.useAllAmount
      ? formatCurrencyUnit(
          ctoken.units[0],
          account.compoundBalance || new BigNumber(0),
          {
            showCode: true,
            disableRounding: true,
          }
        )
      : formatCurrencyUnit(account.token.units[0], transaction.amount, {
          showCode: true,
          disableRounding: true,
        });
    fields.push({
      type: "text",
      label: "Amount",
      value,
      tooltipI18nKey: transaction.useAllAmount
        ? "lend.withdraw.steps.confirmation.tooltip.amountWithdrawn"
        : undefined,
      tooltipI18nArgs: {
        tokenName: ctoken.units[0].code,
      },
    });
    fields.push(contractField(ctoken) as DeviceTransactionField);
  },

  fillOptimisticOperation(a, t, op) {
    op.type = "FEES";
    const subAccount = inferTokenAccount(a, t);

    if (subAccount) {
      const currentRate = findCurrentRate(subAccount.token);
      const value = t.useAllAmount
        ? subAccount.balance.minus(subAccount.spendableBalance)
        : new BigNumber(t.amount || 0);
      const compoundValue = t.useAllAmount
        ? subAccount.compoundBalance || new BigNumber(0)
        : !currentRate
        ? new BigNumber(0)
        : value.div(currentRate.rate).integerValue();
      // ERC20 transfer
      op.subOperations = [
        {
          id: `${subAccount.id}-${op.hash}-REDEEM`,
          hash: op.hash,
          transactionSequenceNumber: op.transactionSequenceNumber,
          type: "REDEEM",
          value,
          fee: op.fee,
          blockHash: null,
          blockHeight: null,
          senders: op.senders,
          recipients: op.recipients,
          accountId: subAccount.id,
          date: new Date(),
          extra: {
            compoundValue: compoundValue.toString(10),
            rate: !currentRate
              ? new BigNumber(0)
              : currentRate.rate.toString(10),
          },
        },
      ];
    }
  },
};
export const modes: Record<Modes, ModeModule> = {
  "compound.supply": compoundSupply,
  "compound.withdraw": compoundWithdraw,
};
export type CurrentRate = {
  token: TokenCurrency;
  ctoken: TokenCurrency;
  rate: BigNumber;
  supplyAPY: string;
  totalSupply: BigNumber; // in the associated token unit (e.g. dai)
};
type CurrentRateRaw = {
  ctokenId: string;
  rate: string;
  supplyAPY: string;
  totalSupply: string;
};

function toCurrentRateRaw(cr: CurrentRate): CurrentRateRaw {
  return {
    ctokenId: cr.ctoken.id,
    rate: cr.rate.toString(10),
    supplyAPY: cr.supplyAPY,
    totalSupply: cr.totalSupply.toString(10),
  };
}

function fromCurrentRateRaw(raw: CurrentRateRaw): CurrentRate {
  const ctoken = getTokenById(raw.ctokenId);
  return {
    ctoken,
    token: getTokenById(ctoken.compoundFor || ""),
    rate: new BigNumber(raw.rate),
    supplyAPY: raw.supplyAPY,
    totalSupply: new BigNumber(raw.totalSupply),
  };
}

type CompoundPreloaded = CurrentRateRaw[];
export function isCompoundDisabled(): boolean {
  return Boolean(compoundPreloadedValue);
}
export function listCurrentRates(): CurrentRate[] {
  return compoundPreloadedValue || [];
}
export function findCurrentRate(
  tokenOrCtoken: TokenCurrency
): CurrentRate | null | undefined {
  if (!compoundPreloadedValue) return;
  return compoundPreloadedValue.find(
    (c) => c.ctoken === tokenOrCtoken || c.token === tokenOrCtoken
  );
}
// FIXME: if the current rate is needed at global level, we should consider having it in preload() stuff
// NB we might want to preload at each sync too.
// if that's the case we need to see how to implement this in bridge cycle.
// => allow to define strategy to reload preload()
export async function preload(
  currency: CryptoCurrency
): Promise<CompoundPreloaded | null | undefined> {
  if (currency.id !== "ethereum") {
    return Promise.resolve(null);
  }

  const ctokens = listSupportedCompoundTokens();
  const currentRates = await fetchCurrentRates(ctokens);
  compoundPreloadedValue = currentRates;
  const preloaded = currentRates ? currentRates.map(toCurrentRateRaw) : null;
  log("compound", "preloaded data", {
    preloaded,
  });
  return preloaded;
}
export function hydrate(
  value: CompoundPreloaded | null | undefined,
  currency: CryptoCurrency
) {
  if (currency.id !== "ethereum") return;
  compoundPreloadedValue = value ? value.map(fromCurrentRateRaw) : null;
}
export function prepareTokenAccounts(
  currency: CryptoCurrency,
  subAccounts: TokenAccount[]
): TokenAccount[] {
  if (currency.id !== "ethereum") return subAccounts;
  if (!compoundPreloadedValue) return subAccounts; // noop if compoundPreloadedValue failed to load

  const compoundByTokenId = inferSubAccountsCompound(currency, subAccounts);
  // add implicitly all ctoken account when a token account exists so we can fetch the balance again
  const implicitCTokenAccounts = values(compoundByTokenId)
    .map(
      ({
        tokenAccount,
        ctokenAccount,
        ctoken,
      }: any): TokenAccount | null | undefined =>
        tokenAccount && !ctokenAccount // TODO reuse generateTokenAccount
          ? {
              // this is a placeholder that will be dropped by digestTokenAccounts
              type: "TokenAccount",
              id: "empty_" + ctoken.id,
              token: ctoken,
              parentId: "",
              balance: new BigNumber(0),
              spendableBalance: new BigNumber(0),
              creationDate: new Date(),
              operationsCount: 0,
              operations: [],
              pendingOperations: [],
              starred: false,
              swapHistory: [],
              balanceHistoryCache: emptyHistoryCache, // calculated in the jsHelpers
            }
          : null
    )
    .filter(Boolean) as TokenAccount[];
  if (implicitCTokenAccounts.length === 0) return subAccounts;
  return subAccounts.concat(implicitCTokenAccounts);
}

const cdaiToDaiOpMapping: Record<any, OperationType> = {
  IN: "SUPPLY",
  OUT: "REDEEM",
};
export async function digestTokenAccounts(
  currency: CryptoCurrency,
  subAccounts: TokenAccount[],
  address: string
): Promise<TokenAccount[]> {
  if (currency.id !== "ethereum") return subAccounts;
  if (!compoundPreloadedValue) return subAccounts; // noop if compoundPreloadedValue failed to load

  const compoundByTokenId = inferSubAccountsCompound(currency, subAccounts);
  if (Object.keys(compoundByTokenId).length === 0) return subAccounts;
  const api = apiForCurrency(currency);
  const approvals = await promiseAllBatched(
    3,
    values(compoundByTokenId),
    async ({ token }: any) =>
      api
        .getERC20ApprovalsPerContract(address, token.contractAddress)
        .then((approvals) => ({
          approvals,
          token,
        }))
  );
  // TODO:
  // for each C* tokens when both C* and * exists:
  // - merge the C* ops in * and dedup
  // - fetch rates of the new C* ops that was not yet digested
  // - fetch current rate
  // - make the balance adding up C* and * rates + availableBalance
  // - add extra operation to reflect the C* ones
  // - remove the C*
  const all = await promiseAllBatched(2, subAccounts, async (a) => {
    // C* tokens are digested by the related ERC20 account so they completely disappear for the user
    const { compoundFor } = a.token;

    if (compoundFor && isCompoundTokenSupported(a.token)) {
      // however, if the related ERC20 account would not exist, we would allow its display
      if (!compoundByTokenId[compoundFor]) {
        return a;
      }

      return;
    }

    const maybeCompound = compoundByTokenId[a.token.id];

    if (maybeCompound) {
      // digest the C* account
      const { ctoken, ctokenAccount } = maybeCompound;

      if (ctokenAccount) {
        // balance = balance + rate * cbalance
        let balance = a.balance;
        const spendableBalance = a.balance;
        const latestRate = findCurrentRate(ctoken);

        if (latestRate) {
          balance = balance.plus(
            ctokenAccount.balance.times(latestRate.rate).integerValue()
          );
        }

        // TODO balanceHistory

        /*
        const minBlockTimestamp = 0; // oldest operation in either token/ctoken account
        const maxBlockTimestamp = 0; // today at 00:00
        const numBuckets = 0; // nb of days between two
        const dailyRates = [];
        const balanceHistory = {};
        // (getBalanceHistoryImpl for dai) + dailyRates[i] * (balance history for cdai)
        */
        // operations, C* to * conversions with the historical rates
        // cIN => SUPPLY
        // cOUT => REDEEM
        const rates = await fetchHistoricalRates(
          ctoken,
          ctokenAccount.operations.map((op) => op.date)
        );

        const newOps = ctokenAccount.operations
          .map((op, i) => {
            const { rate } = rates[i];
            const value = op.value.times(rate).integerValue();
            const type = cdaiToDaiOpMapping[op.type];
            if (!type) return;
            return {
              ...op,
              id: `${a.id}-${op.hash}-${type}`,
              type,
              value,
              accountId: a.id,
              extra: {
                compoundValue: op.value.toString(10),
                rate: rate.toString(10),
              },
            };
          })
          .filter(Boolean);

        // TODO: for perf, we can be a slightly more conservative and keep refs as much as possible to not have a ref changes above
        const approvalsMatch = approvals.find(({ token }) => a.token === token);
        return {
          ...a,
          spendableBalance,
          compoundBalance: ctokenAccount.balance,
          balance,
          operations: mergeOps(a.operations, newOps as any),
          approvals: approvalsMatch ? approvalsMatch.approvals : undefined,
        };
      }
    }

    return a;
  });
  return all.filter(Boolean) as TokenAccount[];
}

const fetch = (path, query = {}) =>
  network({
    method: "GET",
    url: URL.format({
      pathname: `${getEnv("COMPOUND_API")}/api/v2${path}`,
      query,
    }),
  });

async function fetchCurrentRates(
  tokens
): Promise<CurrentRate[] | null | undefined> {
  if (tokens.length === 0) return [];
  const r = await fetch("/ctoken", {
    block_timestamp: 0,
    addresses: tokens.map((c) => c.contractAddress).join(","),
  }).catch((e) => {
    if ("status" in e) {
      // if it's an HTTP error, there might be issue with compound API.
      // we need to be resilent so we turns into degraded mode of our app.
      return null;
    }

    throw e;
  });

  if (!r) {
    return null;
  }

  const { data } = r;
  return tokens
    .map((token) => {
      const cToken = data.cToken.find(
        (ct) =>
          ct.token_address.toLowerCase() === token.contractAddress.toLowerCase()
      );
      if (!cToken) return;
      const otoken = getTokenById(token.compoundFor || "");
      const rawRate = cToken.exchange_rate.value;
      const magnitudeRatio = new BigNumber(10).pow(
        otoken.units[0].magnitude - token.units[0].magnitude
      );
      const rate = new BigNumber(rawRate).times(magnitudeRatio);
      const supplyAPY =
        new BigNumber(cToken.supply_rate.value)
          .times(100)
          .decimalPlaces(2)
          .toString() + "%";
      const totalSupply = new BigNumber(cToken.total_supply.value)
        .times(rawRate)
        .times(new BigNumber(10).pow(otoken.units[0].magnitude));
      return {
        token: otoken,
        ctoken: token,
        rate,
        supplyAPY,
        totalSupply,
      };
    })
    .filter(Boolean);
}

type HistoRate = {
  token: TokenCurrency;
  rate: BigNumber;
};

async function fetchHistoricalRates(
  token,
  dates: Date[]
): Promise<HistoRate[]> {
  const all = await promiseAllBatched(3, dates, async (date) => {
    const { data } = await fetch("/ctoken", {
      block_timestamp: Math.round(date.getTime() / 1000),
      addresses: [token.contractAddress],
    });
    const cToken = data.cToken.find(
      (ct) =>
        ct.token_address.toLowerCase() === token.contractAddress.toLowerCase()
    );
    if (!cToken)
      return {
        token,
        rate: new BigNumber("0"),
      };
    const rawRate = cToken.exchange_rate.value;
    const otoken = getTokenById(token.compoundFor || "");
    const magnitudeRatio = new BigNumber(10).pow(
      otoken.units[0].magnitude - token.units[0].magnitude
    );
    const rate = new BigNumber(rawRate).times(magnitudeRatio);
    return {
      token,
      rate,
    };
  });
  return all;
}

function inferSubAccountsCompound(currency, subAccounts) {
  const compoundByTokenId: Record<
    string,
    | {
        tokenAccount: TokenAccount | null | undefined;
        token: TokenCurrency;
        ctoken: TokenCurrency;
        ctokenAccount: TokenAccount | null | undefined;
      }
    | null
    | undefined
  > = {};
  listSupportedCompoundTokens().forEach((ctoken) => {
    const { compoundFor } = ctoken;

    if (compoundFor) {
      const tokenAccount = subAccounts.find((a) => a.token.id === compoundFor);
      const ctokenAccount = subAccounts.find((a) => a.token === ctoken);
      if (!tokenAccount && !ctokenAccount) return;
      const token = getTokenById(compoundFor);
      compoundByTokenId[compoundFor] = {
        tokenAccount,
        token,
        ctoken,
        ctokenAccount,
      };
    }
  });
  return compoundByTokenId;
}
