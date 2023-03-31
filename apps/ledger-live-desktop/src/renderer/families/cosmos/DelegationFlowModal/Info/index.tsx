import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { openModal, closeModal } from "~/renderer/actions/modals";
import EarnRewardsInfoModal from "~/renderer/components/EarnRewardsInfoModal";
import WarnBox from "~/renderer/components/WarnBox";
import { openURL } from "~/renderer/linking";
import LinkWithExternalIcon from "~/renderer/components/LinkWithExternalIcon";
import cryptoFactory from "@ledgerhq/live-common/families/cosmos/chain/chain";
type Props = {
  name?: string;
  account: AccountLike;
  parentAccount: Account | undefined | null;
};
export default function CosmosEarnRewardsInfoModal({ name, account, parentAccount }: Props) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const onNext = useCallback(() => {
    dispatch(closeModal(name));
    dispatch(
      openModal("MODAL_COSMOS_DELEGATE", {
        parentAccount,
        account,
      }),
    );
  }, [parentAccount, account, dispatch, name]);
  const onLearnMore = useCallback((currencyId: string) => {
    openURL(cryptoFactory(currencyId).stakingDocUrl);
  }, []);
  const crypto = cryptoFactory(account.currency.id);
  return (
    <EarnRewardsInfoModal
      name={name}
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
      footerLeft={
        <LinkWithExternalIcon
          label={t("delegation.howItWorks")}
          onClick={() => onLearnMore(account.currency.id)}
        />
      }
    />
  );
}
