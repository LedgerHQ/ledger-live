// @flow
import type { Account, AccountLike } from "@ledgerhq/live-common/types/index";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { urls } from "~/config/urls";
import { closeModal, openModal } from "~/renderer/actions/modals";
import EarnRewardsInfoModal from "~/renderer/components/EarnRewardsInfoModal";
import LinkWithExternalIcon from "~/renderer/components/LinkWithExternalIcon";
import WarnBox from "~/renderer/components/WarnBox";
import { openURL } from "~/renderer/linking";

type Props = {
  name?: string,
  account: AccountLike,
  parentAccount: ?Account,
};

export default function HeliumEarnRewardsInfoModal({ name, account, parentAccount }: Props) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const onNext = useCallback(() => {
    dispatch(closeModal(name));
    dispatch(
      openModal("MODAL_HELIUM_STAKE", {
        parentAccount,
        account,
      }),
    );
  }, [parentAccount, account, dispatch, name]);

  const onLearnMore = useCallback(() => {
    openURL(urls.helium.staking);
  }, []);

  return (
    <EarnRewardsInfoModal
      name={name}
      onNext={onNext}
      description={t("helium.delegation.earnRewards.description")}
      bullets={[
        t("helium.delegation.earnRewards.bullet.0"),
        t("helium.delegation.earnRewards.bullet.1"),
        t("helium.delegation.earnRewards.bullet.2"),
      ]}
      additional={<WarnBox>{t("helium.delegation.earnRewards.warning")}</WarnBox>}
      footerLeft={<LinkWithExternalIcon label={t("delegation.howItWorks")} onClick={onLearnMore} />}
    />
  );
}
