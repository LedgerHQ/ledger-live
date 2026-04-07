import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "LLD/hooks/redux";
import { openModal } from "~/renderer/actions/modals";
import EarnRewardsInfoModal from "~/renderer/components/EarnRewardsInfoModal";
import WarnBox from "~/renderer/components/WarnBox";
import type { StakingAccount } from "@ledgerhq/coin-evm/types/index";

export type Props = Readonly<{
  account: StakingAccount;
}>;

export default function EvmEarnRewardsInfoModal({ account }: Props) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const onNext = useCallback(() => {
    dispatch(openModal("MODAL_EVM_DELEGATE", { account }));
  }, [account, dispatch]);

  return (
    <EarnRewardsInfoModal
      name="MODAL_EVM_REWARDS_INFO"
      onNext={onNext}
      description={t("cosmos.delegation.flow.steps.starter.description", {
        currencyTicker: account.currency.ticker,
      })}
      bullets={[
        t("cosmos.delegation.flow.steps.starter.bullet.0"),
        t("cosmos.delegation.flow.steps.starter.bullet.1"),
        t("cosmos.delegation.flow.steps.starter.bullet.2"),
      ]}
      additional={
        <WarnBox>{t("cosmos.delegation.flow.steps.starter.warning.description")}</WarnBox>
      }
      currency={account.currency.id}
    />
  );
}
