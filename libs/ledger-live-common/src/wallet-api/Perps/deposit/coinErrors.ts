import BigNumber from "bignumber.js";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { getAccountCurrency } from "@ledgerhq/ledger-wallet-framework/account/index";
import { isAleoAccount } from "@ledgerhq/coin-aleo/logic/utils";
import { EXISTENTIAL_DEPOSIT } from "@ledgerhq/coin-polkadot/utils";
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

const ALEO_SUPPORT_URL = "https://support.ledger.com/article/Aleo-ALEO";

const MINIMUM_BALANCE_RULES: Record<
  string,
  Readonly<{ minimumAtomic: BigNumber; error: DepositFormError }>
> = {
  assethub_polkadot: {
    minimumAtomic: EXISTENTIAL_DEPOSIT,
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

const ACCOUNT_NOT_READY_ERROR: DepositFormError = {
  code: "accountNotReady",
  labelKey: "perpsDeposit.formErrors.accountNotReady",
};

const READINESS_ERRORS: Readonly<Record<string, DepositFormError>> = {
  "sei_evm:activationRequired": SEI_EVM_ERROR,
  "tezos:unrevealed": TEZOS_ERROR,
};

function getReadinessError(mainAccount: Account | undefined): DepositFormError | null {
  const readiness = mainAccount?.readiness;
  if (!mainAccount || readiness?.ready !== false) return null;
  return (
    READINESS_ERRORS[`${mainAccount.currency.id}:${readiness.reason}`] ?? ACCOUNT_NOT_READY_ERROR
  );
}

export function getAccountStateError(
  depositAccount: AccountLike,
  parentAccount: Account | undefined,
  getSpendableBalance: SpendableBalanceReader,
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
  getSpendableBalance: SpendableBalanceReader,
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
