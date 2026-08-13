import { useFeature } from "@features/platform-feature-flags";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import { getBannerState } from "@ledgerhq/live-common/families/internet_computer/neuron";
import { canStakeICP } from "@ledgerhq/live-common/families/internet_computer/react";
import type {
  ICPAccount,
  Transaction,
} from "@ledgerhq/live-common/families/internet_computer/types";
import { useDispatch } from "LLD/hooks/redux";
import { useStake } from "LLD/hooks/useStake";
import React from "react";
import { useTranslation } from "react-i18next";
import { track } from "~/renderer/analytics/segment";
import { openModal } from "~/renderer/actions/modals";
import { AccountBanner } from "~/renderer/screens/account/AccountBanner";
import { stakeDefaultTrack } from "~/renderer/screens/stake/constants";
import { onClickStakeIcp } from "./common";

// `stakeAccountBanner.params` has no internet_computer entry, so that flag can only be read as a
// plain on/off switch, unlike the per-mode params solana and cosmos gate on. On its own it is a
// switch shared with every other coin, so the banner additionally requires the same stakePrograms
// gate AccountHeaderActions applies to its "Stake" action — otherwise the banner and the Earn
// button would appear independently of each other.
const StakeBanner = ({ account }: { account: ICPAccount }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const stakeAccountBanner = useFeature("stakeAccountBanner");
  const { getCanStakeUsingLedgerLive, getCanStakeUsingPlatformApp } = useStake();
  const bridge = useAccountBridge<Transaction>(account);

  const { id: currencyId } = account.currency;
  const canOnlyStakeUsingLedgerLive =
    getCanStakeUsingLedgerLive(currencyId) && !getCanStakeUsingPlatformApp(currencyId);

  if (!stakeAccountBanner?.enabled || !canOnlyStakeUsingLedgerLive) return null;

  const state = getBannerState({ neurons: account.neurons, canStake: canStakeICP(account) });
  if (state === "none") return null;

  const onClick = () => {
    track("button_clicked2", {
      ...stakeDefaultTrack,
      delegation: "stake",
      page: "Page Account",
      button: state === "stakeICP" ? "delegate" : state,
      currency: "INTERNET_COMPUTER",
    });
    if (state === "stakeICP") {
      onClickStakeIcp(dispatch, account, bridge);
    } else if (state === "confirmFollowing") {
      dispatch(openModal("MODAL_ICP_REFRESH_VOTING_POWER", { account }));
    } else {
      // syncNeurons, lockNeurons and addFollowees are all resolved from the neuron list.
      dispatch(openModal("MODAL_ICP_LIST_NEURONS", { account }));
    }
  };

  return (
    <AccountBanner
      display
      title={t(`internetComputer.stakeBanner.${state}.title`)}
      description={t(`internetComputer.stakeBanner.${state}.description`)}
      cta={t(`internetComputer.stakeBanner.${state}.cta`)}
      onClick={onClick}
    />
  );
};

export default StakeBanner;
