import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { SubAccount } from "@ledgerhq/types-live";
import { openModal, closeModal } from "~/renderer/actions/modals";
import EarnRewardsInfoModal from "~/renderer/components/EarnRewardsInfoModal";
import WarnBox from "~/renderer/components/WarnBox";
import { urls } from "~/config/urls";
import { openURL } from "~/renderer/linking";
import LinkWithExternalIcon from "~/renderer/components/LinkWithExternalIcon";
import { NearAccount } from "@ledgerhq/live-common/families/near/types";

export type Props = {
  account: NearAccount | SubAccount;
  parentAccount: NearAccount | undefined | null;
};
export default function NearEarnRewardsInfoModal({ account, parentAccount }: Props) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const onNext = useCallback(() => {
    dispatch(closeModal("MODAL_NEAR_REWARDS_INFO"));
    dispatch(
      openModal("MODAL_NEAR_STAKE", {
        parentAccount,
        account,
      }),
    );
  }, [parentAccount, account, dispatch]);
  const onLearnMore = useCallback(() => {
    openURL(urls.nearStakingRewards);
  }, []);
  return (
    <EarnRewardsInfoModal
      onNext={onNext}
      description={t("near.stake.flow.steps.starter.description")}
      bullets={[
        t("near.stake.flow.steps.starter.bullet.0"),
        t("near.stake.flow.steps.starter.bullet.1"),
        t("near.stake.flow.steps.starter.bullet.2"),
      ]}
      additional={<WarnBox>{t("near.stake.flow.steps.starter.warning.description")}</WarnBox>}
      footerLeft={
        <LinkWithExternalIcon label={t("near.stake.emptyState.info")} onClick={onLearnMore} />
      }
    />
  );
}
