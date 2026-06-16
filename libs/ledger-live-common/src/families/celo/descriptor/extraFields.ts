import type { Account, TokenAccount } from "@ledgerhq/types-live";
import type {
  AmountExtraField,
  AmountExtraFieldOption,
  TransactionPatch,
} from "../../../bridge/descriptor/types";
import { FEE_CURRENCY_BY_CONTRACT, FEE_CURRENCY_OPTIONS } from "../logic";
import type { Transaction as CeloTransaction } from "../types";

/** Option id representing the native CELO fee currency (no token override). */
const NATIVE_OPTION_ID = "celo";

const RESET_PATCH: TransactionPatch = {
  feeCurrency: null,
  feeCurrencyUnwrapped: null,
  feeCurrencyAccountId: null,
};

type EligibleTokenAccount = TokenAccount & { feeCurrencyName: string };

/** Token sub-accounts with a positive balance that are allowlisted as fee currencies. */
function getEligibleTokenAccounts(mainAccount: Account): EligibleTokenAccount[] {
  return (mainAccount.subAccounts ?? [])
    .filter((sub): sub is TokenAccount => sub.type === "TokenAccount")
    .filter(sub => sub.balance.gt(0))
    .filter(sub => FEE_CURRENCY_BY_CONTRACT.has(sub.token.contractAddress.toLowerCase()))
    .map(sub => ({
      ...sub,
      feeCurrencyName:
        FEE_CURRENCY_BY_CONTRACT.get(sub.token.contractAddress.toLowerCase())?.name ??
        sub.token.name,
    }));
}

/**
 * Declarative replacement for the former `celoFeeCurrency` Amount plugin.
 *
 * Celo lets users pay gas in an allowlisted token instead of native CELO. The
 * coin-module owns which tokens qualify and the resulting transaction patch; the
 * generic Amount UI only renders a select and forwards the choice — no Celo code
 * lives in the apps.
 */
export const celoFeeCurrencyField: AmountExtraField = {
  type: "select",
  id: "celoFeeCurrency",
  labelKey: "newSendFlow.feeCurrency",
  testId: "send-celo-fee-currency",

  getOptions: ({ mainAccount }): readonly AmountExtraFieldOption[] => {
    const native: AmountExtraFieldOption = {
      id: NATIVE_OPTION_ID,
      label: FEE_CURRENCY_OPTIONS[0].name,
    };
    const tokens = getEligibleTokenAccounts(mainAccount).map(token => ({
      id: token.id,
      label: token.feeCurrencyName,
    }));
    return [native, ...tokens];
  },

  getSelectedOptionId: ({ transaction }): string => {
    const tx = transaction as CeloTransaction;
    return tx.feeCurrencyAccountId ?? NATIVE_OPTION_ID;
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
    const tx = transaction as CeloTransaction;
    if (!tx.feeCurrencyAccountId) return null;
    // Sub-accounts may still be hydrating: don't reset while we can't tell.
    if (mainAccount.subAccounts === undefined) return null;
    const stillSelectable = getEligibleTokenAccounts(mainAccount).some(
      token => token.id === tx.feeCurrencyAccountId,
    );
    return stillSelectable ? null : RESET_PATCH;
  },
};
