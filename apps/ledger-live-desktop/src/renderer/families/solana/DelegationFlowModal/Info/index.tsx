import { SolanaAccount } from "@ledgerhq/live-common/families/solana/types";
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
  account: SolanaAccount;
};
export default function SolanaEarnRewardsInfoModal({ account }: Props) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const onNext = useCallback(() => {
    dispatch(openModal("MODAL_SOLANA_DELEGATE", { account }));
  }, [account, dispatch]);
  const onLearnMore = useCallback(() => {
    openURL(urls.solana.staking);
  }, []);
  return (
    <EarnRewardsInfoModal
      name="MODAL_SOLANA_REWARDS_INFO"
      onNext={onNext}
      description={t("solana.delegation.earnRewards.description")}
      bullets={[
        t("solana.delegation.earnRewards.bullet.0"),
        t("solana.delegation.earnRewards.bullet.1"),
        t("solana.delegation.earnRewards.bullet.2"),
      ]}
      currency="sol"
      additional={<WarnBox>{t("solana.delegation.earnRewards.warning")}</WarnBox>}
      footerLeft={<LinkWithExternalIcon label={t("delegation.howItWorks")} onClick={onLearnMore} />}
    />
  );
}
