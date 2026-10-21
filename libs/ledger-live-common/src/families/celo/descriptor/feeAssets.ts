import type { Account, TokenAccount } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import type {
  FeeAssetOption,
  FeeAssetsConfig,
  TransactionPatch,
} from "../../../bridge/descriptor/types";
import {
  FEE_CURRENCY_BY_CONTRACT,
  FEE_CURRENCY_OPTIONS,
  STANDARD_FEE_OPTION_ID,
  getFeeOptions,
} from "../logic";
import { GWEI_DIVISOR } from "./constants";

/** Canonical Celo gas values are expressed in Gwei; when paying fees with a token,
 * the UI displays token-decimal values via `customFeeInputValueTransform`.
 */
const CELO_FEE_UNIT_LABEL = "Gwei";
const FEE_INPUT_KEYS = ["fees"] as const;

const RESET_PATCH: TransactionPatch = {
  feeCurrency: null,
  feeCurrencyUnwrapped: null,
  feeCurrencyAccountId: null,
};

function getTransactionStringField(transaction: unknown, key: string): string | null {
  if (typeof transaction !== "object" || transaction === null) return null;
  const value = Reflect.get(transaction, key);
  return typeof value === "string" ? value : null;
}

function getFeeCurrencyAccountId(transaction: unknown): string | null {
  return getTransactionStringField(transaction, "feeCurrencyAccountId");
}

function getFeeCurrencyUnwrapped(transaction: unknown): string | null {
  return getTransactionStringField(transaction, "feeCurrencyUnwrapped");
}

function transformFiniteValue(value: string, transform: (value: BigNumber) => BigNumber): string {
  if (value.trim() === "") return value;

  const parsed = new BigNumber(value);
  if (!parsed.isFinite()) return value;

  const transformed = transform(parsed);
  if (!transformed.isFinite()) return value;

  return transformed.toFixed();
}

const feeAssetInputValueTransform = {
  inputKeys: FEE_INPUT_KEYS,
  fromCanonicalValue: (value: string) =>
    transformFiniteValue(value, parsed => parsed.dividedBy(GWEI_DIVISOR)),
  toCanonicalValue: (value: string) =>
    transformFiniteValue(value, parsed => parsed.times(GWEI_DIVISOR)),
};

/**
 * Token sub-accounts the coin-module's `getFeeOptions` accepts as fee currencies, keyed by option id
 * (the lowercased contract address). Options, patches and reconciliation all read this one list.
 */
function getSelectableTokens(mainAccount: Account): Map<string, TokenAccount> {
  const tokenAccounts = new Map<string, TokenAccount>();
  for (const sub of mainAccount.subAccounts ?? []) {
    if (sub.type === "TokenAccount") {
      tokenAccounts.set(sub.token.contractAddress.toLowerCase(), sub);
    }
  }
  const optionIds = getFeeOptions(
    [...tokenAccounts.values()].map(token => ({
      contractAddress: token.token.contractAddress,
      balance: token.balance,
    })),
  ).map(option => option.id);
  return new Map(
    optionIds.flatMap(id => {
      const token = tokenAccounts.get(id);
      return token ? [[id, token] as const] : [];
    }),
  );
}

function getHydratingSelectedTokenOption(transaction: unknown): FeeAssetOption | null {
  const selectedAccountId = getFeeCurrencyAccountId(transaction);
  const feeCurrencyUnwrapped = getFeeCurrencyUnwrapped(transaction);
  if (!selectedAccountId || !feeCurrencyUnwrapped) return null;

  const feeCurrencyOption = FEE_CURRENCY_BY_CONTRACT.get(feeCurrencyUnwrapped.toLowerCase());
  if (!feeCurrencyOption) return null;

  return {
    id: feeCurrencyUnwrapped.toLowerCase(),
    ticker: feeCurrencyOption.name,
    label: feeCurrencyOption.name,
    customFeeInputValueTransform: feeAssetInputValueTransform,
  };
}

/**
 * Declarative "Pay fees in" selector for Celo, rendered on the Custom Fees step.
 *
 * Celo's fee abstraction lets users pay gas in an allowlisted token instead of
 * native CELO. The coin-module owns which tokens qualify and the resulting
 * transaction patch; the generic Custom Fees UI only renders a select and
 * forwards the choice — no Celo code lives in the apps.
 */
export const celoFeeAssets: FeeAssetsConfig = {
  getOptions: ({ mainAccount, transaction }): readonly FeeAssetOption[] => {
    const native: FeeAssetOption = {
      id: STANDARD_FEE_OPTION_ID,
      ticker: FEE_CURRENCY_OPTIONS[0].name,
      label: FEE_CURRENCY_OPTIONS[0].name,
      unitLabel: CELO_FEE_UNIT_LABEL,
      currency: mainAccount.currency,
      balance: mainAccount.spendableBalance,
    };
    if (mainAccount.subAccounts === undefined) {
      const selectedToken = getHydratingSelectedTokenOption(transaction);
      return selectedToken ? [native, selectedToken] : [native];
    }

    // The coin-module decides which held tokens qualify; this only adds display fields.
    // Token options intentionally omit `unitLabel`: the fee input unit falls back to the
    // ticker while the value is transformed to token decimals.
    const tokens = [...getSelectableTokens(mainAccount)].map(([id, token]) => {
      const name = FEE_CURRENCY_BY_CONTRACT.get(id)?.name ?? token.token.name;
      return {
        id,
        ticker: name,
        label: name,
        customFeeInputValueTransform: feeAssetInputValueTransform,
        currency: token.token,
        balance: token.spendableBalance,
      };
    });
    return [native, ...tokens];
  },

  getSelectedOptionId: ({ transaction }): string => {
    return getFeeCurrencyUnwrapped(transaction)?.toLowerCase() ?? STANDARD_FEE_OPTION_ID;
  },

  buildPatch: (optionId, { mainAccount }): TransactionPatch | null => {
    const id = optionId.toLowerCase();
    if (id === STANDARD_FEE_OPTION_ID) {
      return RESET_PATCH;
    }

    const tokenAccount = getSelectableTokens(mainAccount).get(id);
    if (!tokenAccount) {
      return RESET_PATCH;
    }

    const matchedOption = FEE_CURRENCY_BY_CONTRACT.get(id);
    if (!matchedOption) {
      return RESET_PATCH;
    }

    return {
      feeCurrency: matchedOption.adapterAddress ?? matchedOption.contractAddress ?? null,
      feeCurrencyUnwrapped: matchedOption.contractAddress ?? null,
      feeCurrencyAccountId: tokenAccount.id,
    };
  },

  reconcile: ({ mainAccount, transaction }): TransactionPatch | null => {
    const feeCurrencyAccountId = getFeeCurrencyAccountId(transaction);
    if (!feeCurrencyAccountId) return null;
    // Sub-accounts may still be hydrating: don't reset while we can't tell.
    if (mainAccount.subAccounts === undefined) return null;
    const stillSelectable = [...getSelectableTokens(mainAccount).values()].some(
      token => token.id === feeCurrencyAccountId,
    );
    return stillSelectable ? null : RESET_PATCH;
  },
};
