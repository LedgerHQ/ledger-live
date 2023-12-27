import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { SubAccount } from "@ledgerhq/types-live";
import { openModal } from "~/renderer/actions/modals";
import EarnRewardsInfoModal from "~/renderer/components/EarnRewardsInfoModal";
import { urls } from "~/config/urls";
import { openURL } from "~/renderer/linking";
import LinkWithExternalIcon from "~/renderer/components/LinkWithExternalIcon";
import { AlgorandAccount } from "@ledgerhq/live-common/families/algorand/types";

export type Props = {
  account: AlgorandAccount | SubAccount;
};
export default function AlgorandEarnRewardsInfoModal({ account }: Props) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const onNext = useCallback(() => {
    dispatch(openModal("MODAL_RECEIVE", { account }));
  }, [account, dispatch]);
  const onLearnMore = useCallback(() => {
    openURL(urls.algorandStakingRewards);
  }, []);
  return (
    <EarnRewardsInfoModal
      name="MODAL_ALGORAND_EARN_REWARDS_INFO"
      onNext={onNext}
      nextLabel={t("algorand.claimRewards.flow.steps.starter.button.cta")}
      description={t("algorand.claimRewards.flow.steps.starter.description")}
      bullets={[
        t("algorand.claimRewards.flow.steps.starter.bullet.delegate"),
        t("algorand.claimRewards.flow.steps.starter.bullet.access"),
        t("algorand.claimRewards.flow.steps.starter.bullet.ledger"),
      ]}
      currency="algo"
      additional={null}
      footerLeft={
        <LinkWithExternalIcon
          label={t("algorand.claimRewards.flow.steps.starter.learnMore")}
          onClick={onLearnMore}
        />
      }
    />
  );
}
