import type { Account, TokenAccount } from "@ledgerhq/types-live";
import type {
  FeeAssetOption,
  FeeAssetsConfig,
  TransactionPatch,
} from "../../../bridge/descriptor/types";
import { FEE_CURRENCY_BY_CONTRACT, FEE_CURRENCY_OPTIONS } from "../logic";

/** Option id representing the native CELO fee currency (no token override). */
const NATIVE_OPTION_ID = "celo";

/** Celo gas is always entered in Gwei, regardless of the asset used to pay it. */
const CELO_FEE_UNIT_LABEL = "Gwei";

const RESET_PATCH: TransactionPatch = {
  feeCurrency: null,
  feeCurrencyUnwrapped: null,
  feeCurrencyAccountId: null,
};

type EligibleTokenAccount = TokenAccount & { feeCurrencyName: string };

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

/** Token sub-accounts with a positive balance that are allowlisted as fee currencies. */
function getEligibleTokenAccounts(mainAccount: Account): EligibleTokenAccount[] {
  return (mainAccount.subAccounts ?? [])
    .filter(
      (sub): sub is TokenAccount =>
        sub.type === "TokenAccount" &&
        sub.balance.gt(0) &&
        FEE_CURRENCY_BY_CONTRACT.has(sub.token.contractAddress.toLowerCase()),
    )
    .map(sub => ({
      ...sub,
      feeCurrencyName:
        FEE_CURRENCY_BY_CONTRACT.get(sub.token.contractAddress.toLowerCase())?.name ??
        sub.token.name,
    }));
}

function getHydratingSelectedTokenOption(transaction: unknown): FeeAssetOption | null {
  const selectedAccountId = getFeeCurrencyAccountId(transaction);
  const feeCurrencyUnwrapped = getFeeCurrencyUnwrapped(transaction);
  if (!selectedAccountId || !feeCurrencyUnwrapped) return null;

  const feeCurrencyOption = FEE_CURRENCY_BY_CONTRACT.get(feeCurrencyUnwrapped.toLowerCase());
  if (!feeCurrencyOption) return null;

  return {
    id: selectedAccountId,
    ticker: feeCurrencyOption.name,
    label: feeCurrencyOption.name,
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
      id: NATIVE_OPTION_ID,
      ticker: FEE_CURRENCY_OPTIONS[0].name,
      label: FEE_CURRENCY_OPTIONS[0].name,
      unitLabel: CELO_FEE_UNIT_LABEL,
    };
    if (mainAccount.subAccounts === undefined) {
      const selectedToken = getHydratingSelectedTokenOption(transaction);
      return selectedToken ? [native, selectedToken] : [native];
    }

    // Token options intentionally omit `unitLabel`: the fee input unit then
    // falls back to the asset ticker (e.g. "USDT"), matching the design.
    const tokens = getEligibleTokenAccounts(mainAccount).map(token => ({
      id: token.id,
      ticker: token.feeCurrencyName,
      label: token.feeCurrencyName,
    }));
    return [native, ...tokens];
  },

  getSelectedOptionId: ({ transaction }): string => {
    return getFeeCurrencyAccountId(transaction) ?? NATIVE_OPTION_ID;
  },

  buildPatch: (optionId, { mainAccount }): TransactionPatch | null => {
    if (optionId === NATIVE_OPTION_ID) {
      return RESET_PATCH;
    }

    const tokenAccount = getEligibleTokenAccounts(mainAccount).find(token => token.id === optionId);
    if (!tokenAccount) {
      return RESET_PATCH;
    }

    const matchedOption = FEE_CURRENCY_BY_CONTRACT.get(
      tokenAccount.token.contractAddress.toLowerCase(),
    );
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
    const stillSelectable = getEligibleTokenAccounts(mainAccount).some(
      token => token.id === feeCurrencyAccountId,
    );
    return stillSelectable ? null : RESET_PATCH;
  },
};
