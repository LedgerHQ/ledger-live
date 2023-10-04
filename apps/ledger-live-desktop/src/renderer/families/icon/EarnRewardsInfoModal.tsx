// @flow
import React, { useCallback } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";

import type { Account, AccountLike } from "@ledgerhq/types-live";

import { urls } from "~/config/urls";
import { openURL } from "~/renderer/linking";
import { openModal, closeModal } from "~/renderer/actions/modals";
import EarnRewardsInfoModal from "~/renderer/components/EarnRewardsInfoModal";
import LinkWithExternalIcon from "~/renderer/components/LinkWithExternalIcon";
import WarnBox from "~/renderer/components/WarnBox";

export type Props = {
  account: AccountLike;
  parentAccount: Account;
};

export default function IconEarnRewardsInfoModal({ account, parentAccount }: Props) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const onNext = useCallback(() => {
    dispatch(closeModal("MODAL_ICON_REWARDS_INFO"));
    dispatch(
      openModal("MODAL_ICON_FREEZE", {
        parentAccount,
        account,
      }),
    );
  }, [parentAccount, account, dispatch]);

  return (
    <EarnRewardsInfoModal
      name="MODAL_ICON_REWARDS_INFO"
      onNext={onNext}
      description={t("icon.voting.flow.steps.starter.description")}
      bullets={[
        t("icon.voting.flow.steps.starter.bullet.delegate"),
        t("icon.voting.flow.steps.starter.bullet.access"),
        t("icon.voting.flow.steps.starter.bullet.ledger"),
      ]}
      additional={<WarnBox>{t("icon.voting.flow.steps.starter.termsAndPrivacy")}</WarnBox>}
      footerLeft={
        <LinkWithExternalIcon
          label={<Trans i18nKey="icon.voting.flow.steps.starter.help" />}
          onClick={() => openURL(urls.icon.staking)}
        />
      }
    />
  );
}
