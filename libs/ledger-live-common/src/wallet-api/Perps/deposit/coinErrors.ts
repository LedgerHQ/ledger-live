import BigNumber from "bignumber.js";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { getAccountCurrency } from "@ledgerhq/ledger-wallet-framework/account/index";
import type { DepositFormError } from "./formError";
import { formatDisplayAmount } from "./formatAmount";
import type { PerpsDepositQuote } from "./quote";

const SEI_EVM_ERROR: DepositFormError = {
  code: "seiEvmUnlinked",
  labelKey: "perpsDeposit.formErrors.seiEvmUnlinked",
  supportUrl: "https://support.ledger.com/article/Sei-SEI",
};

const TEZOS_ERROR: DepositFormError = {
  code: "tezosUnrevealed",
  labelKey: "perpsDeposit.formErrors.tezosUnrevealed",
  supportUrl:
    "https://support.ledger.com/article/360016057774-zd?redirect=false#:~:text=Swapping%20Tezos%20(XTZ)%20in%20Ledger%20Live&text=As%20of%20December%202023%2C%20a,your%20Tezos%20(XTZ)%20account",
};

const ALEO_CURRENCY_IDS: ReadonlySet<string> = new Set(["aleo", "aleo_testnet"]);

const ALEO_SUPPORT_URL = "https://support.ledger.com/article/Aleo-ALEO";

const MINIMUM_BALANCE_RULES: Record<
  string,
  Readonly<{ minimumAtomic: BigNumber; error: DepositFormError }>
> = {
  assethub_polkadot: {
    minimumAtomic: new BigNumber(10).pow(10),
    error: {
      code: "dotMinimumBalance",
      labelKey: "perpsDeposit.formErrors.dotMinimumBalance",
      supportUrl: "https://support.ledger.com/article/360016289919-zd?redirect=false",
    },
  },
  stellar: {
    minimumAtomic: new BigNumber(1),
    error: {
      code: "xlmMinimumBalance",
      labelKey: "perpsDeposit.formErrors.xlmMinimumBalance",
      supportUrl: "https://support.ledger.com/article/8278286499997-zd?redirect=false",
    },
  },
};

export type SpendableBalanceReader = (account: AccountLike) => BigNumber;

export const readStoredSpendableBalance: SpendableBalanceReader = account =>
  account.spendableBalance;

const ACCOUNT_NOT_READY_ERROR: DepositFormError = {
  code: "accountNotReady",
  labelKey: "perpsDeposit.formErrors.accountNotReady",
};

function isAleoAccount(account: AccountLike): boolean {
  return account.type === "Account"
    ? account.currency.family === "aleo"
    : ALEO_CURRENCY_IDS.has(account.token.parentCurrencyId);
}

function getReadinessError(mainAccount: Account | undefined): DepositFormError | null {
  if (mainAccount?.readiness?.ready !== false) return null;
  if (mainAccount.currency.id === "sei_evm") return SEI_EVM_ERROR;
  if (mainAccount.currency.id === "tezos") return TEZOS_ERROR;
  return ACCOUNT_NOT_READY_ERROR;
}

export function getAccountStateError(
  depositAccount: AccountLike,
  parentAccount: Account | undefined,
  getSpendableBalance: SpendableBalanceReader = readStoredSpendableBalance,
): DepositFormError | null {
  const mainAccount = depositAccount.type === "Account" ? depositAccount : parentAccount;
  const readinessError = getReadinessError(mainAccount);
  if (readinessError) return readinessError;

  const hasOnlyPrivateFunds =
    isAleoAccount(depositAccount) &&
    depositAccount.spendableBalance.gt(0) &&
    getSpendableBalance(depositAccount).isZero();
  if (hasOnlyPrivateFunds) {
    return {
      code: "aleoPrivateBalance",
      labelKey: "perpsDeposit.formErrors.aleoPrivateBalance",
      values: { ticker: getAccountCurrency(depositAccount).ticker },
      supportUrl: ALEO_SUPPORT_URL,
    };
  }

  return null;
}

function getMinimumBalanceRule(depositAccount: AccountLike) {
  return depositAccount.type === "Account"
    ? MINIMUM_BALANCE_RULES[depositAccount.currency.id]
    : undefined;
}

export function needsFeeForMinimumBalance(
  depositAccount: AccountLike,
  quote: PerpsDepositQuote | undefined,
): boolean {
  return getMinimumBalanceRule(depositAccount) !== undefined && !quote?.estimatedNetworkFee;
}

export function getMinimumBalanceError(
  depositAccount: AccountLike,
  quote: PerpsDepositQuote | undefined,
  sentAmountAtomic: BigNumber | undefined,
  locale: string,
  getSpendableBalance: SpendableBalanceReader = readStoredSpendableBalance,
): DepositFormError | null {
  const rule = getMinimumBalanceRule(depositAccount);
  const fee = quote?.estimatedNetworkFee;
  if (!rule || !fee || !sentAmountAtomic || depositAccount.type !== "Account") return null;

  const remaining = getSpendableBalance(depositAccount)
    .minus(sentAmountAtomic)
    .minus(new BigNumber(fee.amount));
  if (!remaining.lt(rule.minimumAtomic)) return null;

  const magnitude = depositAccount.currency.units[0].magnitude;
  return {
    ...rule.error,
    values: {
      minValue: formatDisplayAmount(
        rule.minimumAtomic.shiftedBy(-magnitude),
        magnitude,
        BigNumber.ROUND_UP,
        locale,
      ),
    },
  };
}
