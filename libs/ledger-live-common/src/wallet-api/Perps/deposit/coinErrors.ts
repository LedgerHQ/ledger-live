import BigNumber from "bignumber.js";
import type { Account, AccountLike } from "@ledgerhq/types-live";
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

type AleoBalances = Readonly<{
  transparentBalance: BigNumber;
  privateBalance: BigNumber | null;
}>;

function isAleoBalances(value: unknown): value is AleoBalances {
  return (
    typeof value === "object" &&
    value !== null &&
    "transparentBalance" in value &&
    BigNumber.isBigNumber(value.transparentBalance)
  );
}

function getAleoBalances(account: AccountLike): AleoBalances | undefined {
  if (account.type === "Account") {
    if (account.currency.family !== "aleo" || !("aleoResources" in account)) return undefined;
    return isAleoBalances(account.aleoResources) ? account.aleoResources : undefined;
  }
  if (account.type !== "TokenAccount" || !ALEO_CURRENCY_IDS.has(account.token.parentCurrencyId)) {
    return undefined;
  }
  return isAleoBalances(account) ? account : undefined;
}

export function getDepositSpendableBalance(account: AccountLike): BigNumber {
  return getAleoBalances(account)?.transparentBalance ?? account.spendableBalance;
}

export function getAccountStateError(
  depositAccount: AccountLike,
  parentAccount: Account | undefined,
): DepositFormError | null {
  const mainAccount = depositAccount.type === "Account" ? depositAccount : parentAccount;
  const isNotReady = mainAccount?.readiness?.ready === false;
  const mainCurrencyId = mainAccount?.currency.id;

  if (isNotReady && mainCurrencyId === "sei_evm") return SEI_EVM_ERROR;
  if (isNotReady && mainCurrencyId === "tezos") return TEZOS_ERROR;

  const aleoBalances = getAleoBalances(depositAccount);
  const hasOnlyPrivateFunds =
    aleoBalances?.privateBalance?.gt(0) === true && aleoBalances.transparentBalance.isZero();
  if (hasOnlyPrivateFunds) {
    const ticker =
      depositAccount.type === "TokenAccount"
        ? depositAccount.token.ticker
        : depositAccount.currency.ticker;
    return {
      code: "aleoPrivateBalance",
      labelKey: "perpsDeposit.formErrors.aleoPrivateBalance",
      values: { ticker },
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
): DepositFormError | null {
  const rule = getMinimumBalanceRule(depositAccount);
  const fee = quote?.estimatedNetworkFee;
  if (!rule || !fee || !sentAmountAtomic || depositAccount.type !== "Account") return null;

  const remaining = depositAccount.spendableBalance
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
