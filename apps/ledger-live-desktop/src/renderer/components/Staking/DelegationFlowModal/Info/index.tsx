import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "LLD/hooks/redux";
import { openModal } from "~/renderer/actions/modals";
import EarnRewardsInfoModal from "~/renderer/components/EarnRewardsInfoModal";
import WarnBox from "~/renderer/components/WarnBox";
import type { StakingAccount } from "@ledgerhq/live-common/families/evm/staking/types";

export type Props = Readonly<{
  account: StakingAccount;
}>;

export default function StakeEarnRewardsInfoModal({ account }: Props) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const onNext = useCallback(() => {
    dispatch(openModal("MODAL_STAKE_DELEGATE", { account }));
  }, [account, dispatch]);

  return (
    <EarnRewardsInfoModal
      name="MODAL_STAKE_REWARDS_INFO"
      onNext={onNext}
      description={t("staking.delegation.flow.steps.starter.description", {
        currencyTicker: account.currency.ticker,
      })}
      bullets={[
        t("staking.delegation.flow.steps.starter.bullet.0"),
        t("staking.delegation.flow.steps.starter.bullet.1"),
        t("staking.delegation.flow.steps.starter.bullet.2"),
      ]}
      additional={
        <WarnBox>{t("staking.delegation.flow.steps.starter.warning.description")}</WarnBox>
      }
      currency={account.currency.id}
    />
  );
}
