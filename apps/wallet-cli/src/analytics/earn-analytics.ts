import { track } from "./segment";

const EARN = "Earn";

export function trackEarnYieldsRequested(p: { network: string }): void {
  track("earn_yields_requested", {
    page: EARN,
    network: p.network,
  });
}

export function trackEarnYieldsReturned(p: { network: string; rowsCount: number }): void {
  track("earn_yields_returned", {
    page: EARN,
    network: p.network,
    rowsCount: p.rowsCount,
  });
}

export function trackEarnPositionsRequested(p: { network: string }): void {
  track("earn_positions_requested", {
    page: EARN,
    network: p.network,
  });
}

export function trackEarnPositionsReturned(p: { network: string; positionsCount: number }): void {
  track("earn_positions_returned", {
    page: EARN,
    network: p.network,
    positionsCount: p.positionsCount,
  });
}

export function trackEarnDepositStarted(p: {
  family: string;
  network: string;
  product: string;
  amount: string;
  dryRun: boolean;
}): void {
  track("earn_deposit_started", {
    page: EARN,
    family: p.family,
    network: p.network,
    product: p.product,
    amount: p.amount,
    dryRun: p.dryRun,
  });
}

export function trackEarnDepositCompleted(p: {
  family: string;
  network: string;
  amount: string;
  status: string;
  transactionsCount: number;
}): void {
  track("earn_deposit_completed", {
    page: EARN,
    family: p.family,
    network: p.network,
    amount: p.amount,
    status: p.status,
    transactionsCount: p.transactionsCount,
  });
}

export function trackEarnDepositRejected(p: { network: string; device?: string }): void {
  track("earn_deposit_rejected", {
    page: EARN,
    network: p.network,
    device: p.device,
  });
}

export function trackEarnDepositFailed(p: { errorCode: string; errorMessage: string }): void {
  track("earn_deposit_failed", {
    page: EARN,
    errorCode: p.errorCode,
    errorMessage: p.errorMessage,
  });
}

export function trackEarnWithdrawStarted(p: {
  family: string;
  network: string;
  product?: string;
  // A Solana stake account is a user-specific base58 public key tied to the wallet. wallet-cli
  // deliberately anonymizes analytics (fixed user id, `ip: 0.0.0.0`) and never lets raw addresses
  // leave the machine, so we only track *whether* a stake account was targeted, not its value.
  hasStakeAccount: boolean;
  amount?: string;
  finalize: boolean;
  dryRun: boolean;
}): void {
  track("earn_withdraw_started", {
    page: EARN,
    family: p.family,
    network: p.network,
    product: p.product,
    hasStakeAccount: p.hasStakeAccount,
    amount: p.amount,
    finalize: p.finalize,
    dryRun: p.dryRun,
  });
}

export function trackEarnWithdrawCompleted(p: {
  family: string;
  network: string;
  status: string;
  transactionsCount: number;
}): void {
  track("earn_withdraw_completed", {
    page: EARN,
    family: p.family,
    network: p.network,
    status: p.status,
    transactionsCount: p.transactionsCount,
  });
}

export function trackEarnWithdrawRejected(p: { network: string; device?: string }): void {
  track("earn_withdraw_rejected", {
    page: EARN,
    network: p.network,
    device: p.device,
  });
}

export function trackEarnWithdrawFailed(p: { errorCode: string; errorMessage: string }): void {
  track("earn_withdraw_failed", {
    page: EARN,
    errorCode: p.errorCode,
    errorMessage: p.errorMessage,
  });
}
