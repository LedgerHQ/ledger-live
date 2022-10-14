import type { NearAccount } from "./types";

function formatAccountSpecifics(account: NearAccount): string {
  const { nearResources } = account;
  if (!nearResources) {
    throw new Error("near account expected");
  }

  let str = " ";

  str += account.balance ? `\n    Full Balance: ${account.balance}` : "";
  str += nearResources.stakedBalance
    ? `\n    Staked Balance: ${nearResources.stakedBalance}`
    : "";
  str += nearResources.pendingBalance
    ? `\n    Pending Balance: ${nearResources.pendingBalance}`
    : "";
  str += nearResources.availableBalance
    ? `\n    Withdrawable Balance: ${nearResources.availableBalance}`
    : "";
  str += nearResources.storageUsageBalance
    ? `\n    Storage Usage Balance: ${nearResources.storageUsageBalance}`
    : "";

  if (nearResources.stakingPositions.length) {
    str += `\n    Staking Positions:\n`;
    str += nearResources.stakingPositions
      .map(
        ({ validatorId, staked, pending, available, rewards }) =>
          `        Validator ID: ${validatorId} | Staked: ${staked} | Pending Release: ${pending} | Available: ${available} | Rewards: ${rewards}`
      )
      .join("\n");
  }

  return str;
}

export default {
  formatAccountSpecifics,
};
