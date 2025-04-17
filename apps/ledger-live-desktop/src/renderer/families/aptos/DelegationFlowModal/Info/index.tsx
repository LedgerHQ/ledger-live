import { AptosAccount } from "@ledgerhq/live-common/families/aptos/types";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { urls } from "~/config/urls";
import { openModal } from "~/renderer/actions/modals";

import EarnRewardsInfoModal from "~/renderer/components/EarnRewardsInfoModal";
import LinkWithExternalIcon from "~/renderer/components/LinkWithExternalIcon";
import WarnBox from "~/renderer/components/WarnBox";
import { openURL } from "~/renderer/linking";
export type Props = {
  account: AptosAccount;
};
export default function AptosEarnRewardsInfoModal({ account }: Props) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const onNext = useCallback(() => {
    dispatch(openModal("MODAL_APTOS_DELEGATE", { account }));
  }, [account, dispatch]);
  const onLearnMore = useCallback(() => {
    openURL(urls.aptos.staking);
  }, []);
  return (
    <EarnRewardsInfoModal
      name="MODAL_APTOS_REWARDS_INFO"
      onNext={onNext}
      description={t("aptos.delegation.earnRewards.description")}
      bullets={[
        t("aptos.delegation.earnRewards.bullet.0"),
        t("aptos.delegation.earnRewards.bullet.1"),
        t("aptos.delegation.earnRewards.bullet.2"),
      ]}
      currency="sol"
      additional={<WarnBox>{t("aptos.delegation.earnRewards.warning")}</WarnBox>}
      footerLeft={<LinkWithExternalIcon label={t("delegation.howItWorks")} onClick={onLearnMore} />}
    />
  );
}
