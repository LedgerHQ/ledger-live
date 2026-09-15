import { useFeature } from "@features/platform-feature-flags";
import { getBannerState } from "@ledgerhq/live-common/families/internet_computer/neuron";
import { canStakeICP } from "@ledgerhq/live-common/families/internet_computer/react";
import {
  NeuronsData,
  type ICPAccount,
} from "@ledgerhq/live-common/families/internet_computer/types";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import React from "react";
import StakeBanners from "./StakeBanners";

type Props = Readonly<{
  account: AccountLike;
  parentAccount?: Account;
}>;

/**
 * ICP's slot in the account body, currently just the staking banner.
 *
 * The state is decided here rather than inside the banner because the account page invokes this as a
 * plain function and reads the result to decide whether to draw its bordered container at all — a
 * banner that rendered null from within would leave an empty box behind.
 */
export default function InternetComputerAccountBodyHeader({ account }: Props) {
  const llmIcpStaking = useFeature("llmIcpStaking");
  if (!llmIcpStaking?.enabled || account.type !== "Account") return null;

  const icpAccount = account as ICPAccount;
  const state = getBannerState({
    // `neurons` is typed as required but is only populated by a sync or a deserialize, so an account
    // added moments ago — or a mock one — reaches here without it, and getBannerState destructures it.
    neurons: icpAccount.neurons ?? NeuronsData.empty(),
    canStake: canStakeICP(icpAccount),
  });

  if (state === "none") return null;

  return <StakeBanners account={icpAccount} state={state} />;
}
