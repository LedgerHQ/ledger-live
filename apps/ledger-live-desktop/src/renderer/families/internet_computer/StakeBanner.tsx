import { useFeature } from "@features/platform-feature-flags";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import { canStakeICP, useICPNeurons } from "@ledgerhq/live-common/families/internet_computer/react";
import type {
  ICPAccount,
  Transaction,
} from "@ledgerhq/live-common/families/internet_computer/types";
import { useDispatch } from "LLD/hooks/redux";
import React from "react";
import { useTranslation } from "react-i18next";
import { track } from "~/renderer/analytics/segment";
import { AccountBanner } from "~/renderer/screens/account/AccountBanner";
import { stakeDefaultTrack } from "~/renderer/screens/stake/constants";
import { onClickStakeIcp } from "./common";

// `stakeAccountBanner.params` has no internet_computer entry, so the flag is read as a plain
// on/off switch rather than the per-mode params solana and cosmos gate on.
const StakeBanner = ({ account }: { account: ICPAccount }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const stakeAccountBanner = useFeature("stakeAccountBanner");
  const bridge = useAccountBridge<Transaction>(account);
  const neurons = useICPNeurons(account);

  if (!stakeAccountBanner?.enabled) return null;
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
