import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "LLD/hooks/redux";
import { openModal } from "~/renderer/reducers/modals";
import EarnRewardsInfoModal from "~/renderer/components/EarnRewardsInfoModal";
import WarnBox from "~/renderer/components/WarnBox";
import { urls } from "~/config/urls";
import { openURL } from "~/renderer/linking";
import LinkWithExternalIcon from "~/renderer/components/LinkWithExternalIcon";
import { AptosAccount } from "@ledgerhq/live-common/families/aptos/types";

export type Props = {
  account: AptosAccount;
};

export default function AptosEarnRewardsInfoModal({ account }: Readonly<Props>) {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const onNext = useCallback(() => {
    dispatch(
      openModal("MODAL_APTOS_STAKE", {
        account,
      }),
    );
  }, [account, dispatch]);

  const onLearnMore = useCallback(() => {
    openURL(urls.ledgerValidator);
  }, []);

  return (
    <EarnRewardsInfoModal
      name="MODAL_APTOS_REWARDS_INFO"
      onNext={onNext}
      description={t("aptos.stake.flow.steps.starter.description")}
      bullets={[
        t("aptos.stake.flow.steps.starter.bullet.0"),
        t("aptos.stake.flow.steps.starter.bullet.1"),
        t("aptos.stake.flow.steps.starter.bullet.2"),
      ]}
      currency="aptos"
      additional={<WarnBox>{t("aptos.stake.flow.steps.starter.warning.description")}</WarnBox>}
      footerLeft={
        <LinkWithExternalIcon label={t("aptos.stake.emptyState.info")} onClick={onLearnMore} />
      }
    />
  );
}
