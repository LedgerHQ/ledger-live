import { useFeature } from "@features/platform-feature-flags";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import { canStakeICP, useICPNeurons } from "@ledgerhq/live-common/families/internet_computer/react";
import type {
  ICPAccount,
  Transaction,
} from "@ledgerhq/live-common/families/internet_computer/types";
import { useDispatch } from "LLD/hooks/redux";
import { useStake } from "LLD/hooks/useStake";
import React from "react";
import { useTranslation } from "react-i18next";
import { track } from "~/renderer/analytics/segment";
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
  const neurons = useICPNeurons(account);

  const { id: currencyId } = account.currency;
  const canOnlyStakeUsingLedgerLive =
    getCanStakeUsingLedgerLive(currencyId) && !getCanStakeUsingPlatformApp(currencyId);

  if (!stakeAccountBanner?.enabled || !canOnlyStakeUsingLedgerLive) return null;
  if (neurons.length > 0 || !canStakeICP(account)) return null;

  const onClick = () => {
    track("button_clicked2", {
      ...stakeDefaultTrack,
      delegation: "stake",
      page: "Page Account",
      button: "delegate",
      currency: "INTERNET_COMPUTER",
    });
    onClickStakeIcp(dispatch, account, bridge);
  };

  return (
    <AccountBanner
      display
      title={t("internetComputer.stakeBanner.stakeICP.title")}
      description={t("internetComputer.stakeBanner.stakeICP.description")}
      cta={t("internetComputer.stakeBanner.stakeICP.cta")}
      onClick={onClick}
    />
  );
};

export default StakeBanner;
