import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { openModal } from "~/renderer/actions/modals";
import EarnRewardsInfoModal from "~/renderer/components/EarnRewardsInfoModal";
import WarnBox from "~/renderer/components/WarnBox";
import { openURL } from "~/renderer/linking";
import LinkWithExternalIcon from "~/renderer/components/LinkWithExternalIcon";
import cryptoFactory from "@ledgerhq/live-common/families/cosmos/chain/chain";
import { CosmosAccount } from "@ledgerhq/live-common/families/cosmos/types";

export type Props = {
  account: CosmosAccount;
};

export default function CosmosEarnRewardsInfoModal({ account }: Props) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const onNext = useCallback(() => {
    dispatch(openModal("MODAL_COSMOS_DELEGATE", { account }));
  }, [account, dispatch]);
  const onLearnMore = useCallback((currencyId: string) => {
    openURL(cryptoFactory(currencyId).stakingDocUrl);
  }, []);
  const crypto = cryptoFactory(account.currency.id);
  return (
    <EarnRewardsInfoModal
      name="MODAL_COSMOS_REWARDS_INFO"
      onNext={onNext}
      description={t("cosmos.delegation.flow.steps.starter.description", {
        currencyTicker: account.currency.ticker,
      })}
      bullets={[
        t("cosmos.delegation.flow.steps.starter.bullet.0"),
        t("cosmos.delegation.flow.steps.starter.bullet.1"),
        t("cosmos.delegation.flow.steps.starter.bullet.2", {
          numberOfDays: crypto.unbondingPeriod,
        }),
      ]}
      additional={
        <WarnBox>{t("cosmos.delegation.flow.steps.starter.warning.description")}</WarnBox>
      }
      currency="cosmos"
      footerLeft={
        <LinkWithExternalIcon
          label={t("delegation.howItWorks")}
          onClick={() => onLearnMore(account.currency.id)}
        />
      }
    />
  );
}
