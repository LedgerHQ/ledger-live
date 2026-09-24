import { track } from "./segment";

const EARN = "Earn";

export async function trackEarnYieldsRequested(p: { network: string }): Promise<void> {
  await track("earnyields_requested", {
    page: EARN,
    network: p.network,
  });
}

export async function trackEarnYieldsReturned(p: {
  network: string;
  rowsCount: number;
}): Promise<void> {
  await track("earnyields_returned", {
    page: EARN,
    network: p.network,
    rowsCount: p.rowsCount,
  });
}

export async function trackEarnPositionsRequested(p: { network: string }): Promise<void> {
  await track("earnpositions_requested", {
    page: EARN,
    network: p.network,
  });
}

export async function trackEarnPositionsReturned(p: {
  network: string;
  positionsCount: number;
}): Promise<void> {
  await track("earnpositions_returned", {
    page: EARN,
    network: p.network,
    positionsCount: p.positionsCount,
  });
}

export async function trackEarnDepositStarted(p: {
  family: string;
  network: string;
  product: string;
  amount: string;
  dryRun: boolean;
}): Promise<void> {
  await track("earndeposit_started", {
    page: EARN,
    family: p.family,
    network: p.network,
    product: p.product,
    amount: p.amount,
    dryRun: p.dryRun,
  });
}

export async function trackEarnDepositCompleted(p: {
  family: string;
  network: string;
  amount: string;
  status: string;
  transactionsCount: number;
}): Promise<void> {
  await track("earndeposit_completed", {
    page: EARN,
    family: p.family,
    network: p.network,
    amount: p.amount,
    status: p.status,
    transactionsCount: p.transactionsCount,
  });
}

export async function trackEarnDepositRejected(p: {
  network: string;
  device?: string;
}): Promise<void> {
  await track("earndeposit_rejected", {
    page: EARN,
    network: p.network,
    device: p.device,
  });
}

export async function trackEarnDepositFailed(p: {
  errorCode: string;
  errorMessage: string;
}): Promise<void> {
  await track("earndeposit_failed", {
    page: EARN,
    errorCode: p.errorCode,
    errorMessage: p.errorMessage,
  });
}

export async function trackEarnWithdrawStarted(p: {
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
}): Promise<void> {
  await track("earnwithdraw_started", {
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

export async function trackEarnWithdrawCompleted(p: {
  family: string;
  network: string;
  status: string;
  transactionsCount: number;
}): Promise<void> {
  await track("earnwithdraw_completed", {
    page: EARN,
    family: p.family,
    network: p.network,
    status: p.status,
    transactionsCount: p.transactionsCount,
  });
}

export async function trackEarnWithdrawRejected(p: {
  network: string;
  device?: string;
}): Promise<void> {
  await track("earnwithdraw_rejected", {
    page: EARN,
    network: p.network,
    device: p.device,
  });
}

export async function trackEarnWithdrawFailed(p: {
  errorCode: string;
  errorMessage: string;
}): Promise<void> {
  await track("earnwithdraw_failed", {
    page: EARN,
    errorCode: p.errorCode,
    errorMessage: p.errorMessage,
  });
}
