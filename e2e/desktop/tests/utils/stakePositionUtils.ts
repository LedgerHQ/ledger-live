import BigNumber from "bignumber.js";
import type { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import type { Application } from "tests/page";
import type { StoreAccount, StoreStakingPosition } from "tests/utils/redux";

/** An active stake of an account, as the app holds it. */
export type ActiveSolanaStakePosition = {
  network: string;
  ownerAddress: string;
  /** The address of the stake account. */
  positionId: string;
  /** The vote account of its validator. */
  validatorAddress: string;
  /** The delegated amount, in lamports. */
  amount: string;
  unit: StoreAccount["unit"];
  /** Its row among the delegations of the account page. */
  rowIndex: number;
};

/** The order of `listSolanaStakingPositions`, which lists the delegations of the account page. */
const listedPositions = (positions: StoreStakingPosition[]) =>
  positions.toSorted(
    (a, b) =>
      new BigNumber(b.amount).comparedTo(a.amount) ||
      new BigNumber(b.withdrawableAmount ?? 0).comparedTo(a.withdrawableAmount ?? 0) ||
      0,
  );

/** Activated, not deactivating, and the account holds the authority that deactivates it. */
const isActiveStake = ({ positionId, status, canStake }: StoreStakingPosition) =>
  !!positionId && status === "bonded" && canStake === true;

const describePositions = (positions: StoreStakingPosition[]) =>
  positions
    .map(({ positionId, status, canStake }) =>
      canStake ? `${positionId} ${status}` : `${positionId} ${status} without stake authority`,
    )
    .join(", ") || "none";

/**
 * Opens the account page and reads its first active stake once the sync is over. Stake account
 * addresses are random, so no test data can name one: the seed must hold it on mainnet.
 */
export async function openAccountWithActiveSolanaStake(
  app: Application,
  account: Account,
): Promise<ActiveSolanaStakePosition> {
  await app.mainNavigation.openTargetFromMainNavigation("accounts");
  await app.accounts.navigateToAccountByName(account.accountName);
  await app.layout.waitForSyncButtonToBeEnabled();

  const storeAccount = (await app.redux.getAccounts()).find(
    ({ currencyId, index }) => currencyId === account.currency.id && index === account.index,
  );
  if (!storeAccount) {
    throw new Error(`${account.accountName} is not in the wallet: its CLI seeding did not add it`);
  }
  const positions = listedPositions(storeAccount.stakingPositions);
  const rowIndex = positions.findIndex(isActiveStake);
  const position = positions[rowIndex];
  if (!position?.positionId) {
    throw new Error(
      `Blocked: ${account.accountName} (${storeAccount.freshAddress}) holds no active stake it can ` +
        `deactivate (positions: ${describePositions(positions)}). The QA seed must keep an ` +
        "activated, not deactivating, stake account delegated from it on Solana mainnet.",
    );
  }
  return {
    network: storeAccount.currencyId,
    ownerAddress: storeAccount.freshAddress,
    positionId: position.positionId,
    validatorAddress: position.validatorAddress,
    amount: position.amount,
    unit: storeAccount.unit,
    rowIndex,
  };
}
