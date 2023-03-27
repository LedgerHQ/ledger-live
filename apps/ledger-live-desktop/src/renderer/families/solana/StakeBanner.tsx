import { Account } from "@ledgerhq/types-live";
import { useTranslation } from "react-i18next";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";

import { AccountBanner } from "~/renderer/screens/account/AccountBanner";
import { track } from "~/renderer/analytics/segment";
import { stakeDefaultTrack } from "~/renderer/screens/stake/constants";
import React from "react";
import { StakeAccountBannerParams } from "~/renderer/screens/account/types";
import { useSolanaStakesWithMeta } from "@ledgerhq/live-common/families/solana/react";
import { getAccountBannerState as getSolanaBannerState } from "@ledgerhq/live-common/families/solana/banner";
import { openModal } from "~/renderer/actions/modals";
import { useDispatch } from "react-redux";

const StakeBanner: React.FC<{ account: Account }> = ({ account }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const stakeAccountBanner = useFeature("stakeAccountBanner");
  const stakesWithMeta = useSolanaStakesWithMeta(
    account.currency,
    account?.solanaResources?.stakes,
  );
  const stakeAccountBannerParams: StakeAccountBannerParams | null =
    stakeAccountBanner?.params ?? null;
  const state = getSolanaBannerState(account);
  const { redelegate, display, ledgerValidator, stakeAccAddr } = state;

  if (redelegate && !stakeAccountBannerParams?.solana?.redelegate) return null;
  if (!redelegate && !stakeAccountBannerParams?.solana?.delegate) return null;

  const commission = ledgerValidator?.commission ? ledgerValidator?.commission : 1;
  const stakeWithMeta = stakesWithMeta?.find(s => s.stake?.stakeAccAddr === stakeAccAddr);
  const title = redelegate
    ? t("account.banner.redelegation.solana.title")
    : t("account.banner.delegation.title");
  const description = redelegate
    ? t("account.banner.redelegation.solana.description")
    : t("account.banner.delegation.description", {
        asset: account.currency.ticker,
        commission,
      });
  const cta = redelegate
    ? t("account.banner.redelegation.cta")
    : t("account.banner.delegation.cta");
  const linkText = redelegate
    ? t("account.banner.redelegation.linkText")
    : t("account.banner.delegation.linkText");
  const linkUrl = redelegate
    ? "https://support.ledger.com/hc/en-us/articles/4731749170461-Staking-Solana-SOL-in-Ledger-Live?support=true"
    : "https://www.ledger.com/staking/ledger-node/solana";
  const onClick = () => {
    track("button_clicked", {
      ...stakeDefaultTrack,
      delegation: "stake",
      page: "Page Account",
      button: "delegate",
      redelegate,
      currency: "SOLANA",
    });
    if (redelegate) {
      dispatch(
        openModal("MODAL_SOLANA_DELEGATION_DEACTIVATE", {
          account,
          stakeWithMeta,
        }),
      );
    } else {
      dispatch(
        openModal("MODAL_SOLANA_DELEGATE", {
          account,
        }),
      );
    }
  };

  if (!display) return null;

  return (
    <AccountBanner
      title={title}
      description={description}
      cta={cta}
      onClick={onClick}
      display={true}
      linkText={linkText}
      linkUrl={linkUrl}
    />
  );
};

export default StakeBanner;
