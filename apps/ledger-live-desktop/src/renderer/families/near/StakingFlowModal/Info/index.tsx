import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { openModal, closeModal } from "~/renderer/actions/modals";
import EarnRewardsInfoModal from "~/renderer/components/EarnRewardsInfoModal";
import WarnBox from "~/renderer/components/WarnBox";
import { urls } from "~/config/urls";
import { openURL } from "~/renderer/linking";
import LinkWithExternalIcon from "~/renderer/components/LinkWithExternalIcon";
type Props = {
  name?: string;
  account: AccountLike;
  parentAccount: Account | undefined | null;
};
export default function NearEarnRewardsInfoModal({ name, account, parentAccount }: Props) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const onNext = useCallback(() => {
    dispatch(closeModal(name));
    dispatch(
      openModal("MODAL_NEAR_STAKE", {
        parentAccount,
        account,
      }),
    );
  }, [parentAccount, account, dispatch, name]);
  const onLearnMore = useCallback(() => {
    openURL(urls.nearStakingRewards);
  }, []);
  return (
    <EarnRewardsInfoModal
      name={name}
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
