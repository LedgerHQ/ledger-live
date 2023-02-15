import { useTranslation } from "react-i18next";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";

import { getAccountBannerState } from "@ledgerhq/live-common/families/cosmos/banner";
import { AccountBanner } from "~/renderer/screens/account/AccountBanner";
import React from "react";
import { StakeAccountBannerParams } from "~/renderer/screens/account/types";
import { CosmosAccount } from "@ledgerhq/live-common/families/cosmos/types";
import { openModal } from "~/renderer/actions/modals";
import { useDispatch } from "react-redux";

export const CosmosStakeBanner: React.FC<{ account: CosmosAccount }> = ({ account }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const stakeAccountBanner = useFeature("stakeAccountBanner");
  const stakeAccountBannerParams: StakeAccountBannerParams | null =
    stakeAccountBanner?.params ?? null;
  const state = getAccountBannerState(account);
  const { redelegate, ledgerValidator, validatorSrcAddress } = state;

  if (redelegate && !stakeAccountBannerParams?.cosmos?.redelegate) return null;
  if (!redelegate && !stakeAccountBannerParams?.cosmos?.delegate) return null;

  const commission = ledgerValidator?.commission ? ledgerValidator?.commission * 100 : 1;
  const title = redelegate
    ? t("account.banner.redelegation.title")
    : t("account.banner.delegation.title");
  const description = redelegate
    ? t("account.banner.redelegation.description")
    : t("account.banner.delegation.description", {
        asset: account.currency.ticker,
        commission,
      });
  const cta = redelegate
    ? t("account.banner.redelegation.cta")
    : t("account.banner.delegation.cta");

  const onClick = () => {
    if (redelegate) {
      dispatch(
        openModal("MODAL_COSMOS_REDELEGATE", {
          account,
          validatorAddress: validatorSrcAddress,
          validatorDstAddress: ledgerValidator?.validatorAddress || "",
        }),
      );
    } else {
      dispatch(
        openModal("MODAL_COSMOS_DELEGATE", {
          account,
        }),
      );
    }
  };

  return (
    <AccountBanner
      title={title}
      description={description}
      cta={cta}
      onClick={onClick}
      display={true}
      linkText={t("account.banner.delegation.linkText")}
      linkUrl={"https://www.ledger.com/staking-ethereum"}
    />
  );
};
