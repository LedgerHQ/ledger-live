import React, { useCallback } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { urls } from "~/config/urls";
import { openURL } from "~/renderer/linking";
import { openModal } from "~/renderer/actions/modals";
import EarnRewardsInfoModal from "~/renderer/components/EarnRewardsInfoModal";
import LinkWithExternalIcon from "~/renderer/components/LinkWithExternalIcon";
import WarnBox from "~/renderer/components/WarnBox";
import { PolkadotAccount } from "@ledgerhq/live-common/families/polkadot/types";

export type Props = {
  account: PolkadotAccount;
};
export default function PolkadotEarnRewardsInfoModal({ account }: Props) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const onNext = useCallback(() => {
    dispatch(openModal("MODAL_POLKADOT_BOND", { account }));
  }, [account, dispatch]);
  return (
    <EarnRewardsInfoModal
      name="MODAL_POLKADOT_REWARDS_INFO"
      onNext={onNext}
      description={t("polkadot.bond.steps.starter.description")}
      bullets={[
        t("polkadot.bond.steps.starter.bullet.0"),
        t("polkadot.bond.steps.starter.bullet.1"),
        t("polkadot.bond.steps.starter.bullet.2"),
      ]}
      currency="dot"
      additional={<WarnBox>{t("polkadot.bond.steps.starter.warning")}</WarnBox>}
      footerLeft={
        <LinkWithExternalIcon
          label={<Trans i18nKey="polkadot.bond.steps.starter.help" />}
          onClick={() => openURL(urls.stakingPolkadot)}
        />
      }
    />
  );
}
