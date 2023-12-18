import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { openModal, closeModal } from "~/renderer/actions/modals";
import EarnRewardsInfoModal from "~/renderer/components/EarnRewardsInfoModal";
import { urls } from "~/config/urls";
import { openURL } from "~/renderer/linking";
import LinkWithExternalIcon from "~/renderer/components/LinkWithExternalIcon";
import { CardanoAccount } from "@ledgerhq/live-common/families/cardano/types";

export type CardanoEarnRewardsInfoModalProps = {
  account: CardanoAccount;
};

export default function CardanoEarnRewardsInfoModal({ account }: CardanoEarnRewardsInfoModalProps) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const onNext = useCallback(() => {
    dispatch(closeModal("MODAL_CARDANO_REWARDS_INFO"));
    dispatch(
      openModal("MODAL_CARDANO_DELEGATE", {
        account,
      }),
    );
  }, [account, dispatch]);
  const onLearnMore = useCallback(() => {
    openURL(urls.cardanoStakingRewards);
  }, []);
  return (
    <EarnRewardsInfoModal
      name="MODAL_CARDANO_REWARDS_INFO"
      onNext={onNext}
      description={t("cardano.delegation.flow.steps.starter.description")}
      bullets={[
        t("cardano.delegation.flow.steps.starter.bullet.0"),
        t("cardano.delegation.flow.steps.starter.bullet.1"),
        t("cardano.delegation.flow.steps.starter.bullet.2"),
      ]}
      currency="cardano"
      footerLeft={<LinkWithExternalIcon label={t("delegation.howItWorks")} onClick={onLearnMore} />}
      additional={null}
    />
  );
}
