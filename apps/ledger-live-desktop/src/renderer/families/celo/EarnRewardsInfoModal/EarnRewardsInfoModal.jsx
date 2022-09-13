// @flow
import type { Account, AccountLike } from "@ledgerhq/types-live";
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

const CeloEarnRewardsInfoModal = ({ name, account, parentAccount }: Props) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const onNext = useCallback(() => {
    dispatch(closeModal(name));

    if (account.celoResources?.registrationStatus) {
      dispatch(
        openModal("MODAL_CELO_LOCK", {
          parentAccount,
          account,
        }),
      );
    } else {
      dispatch(
        openModal("MODAL_CELO_SIMPLE_OPERATION", {
          parentAccount,
          account,
          mode: "register",
        }),
      );
    }
  }, [parentAccount, account, dispatch, name]);

  const onLearnMore = useCallback(() => {
    openURL(urls.celo.learnMore);
  }, []);

  return (
    <EarnRewardsInfoModal
      name={name}
      onNext={onNext}
      description={t("celo.delegation.earnRewards.description")}
      bullets={[
        t("celo.delegation.earnRewards.bullet.0"),
        t("celo.delegation.earnRewards.bullet.1"),
        t("celo.delegation.earnRewards.bullet.2"),
      ]}
      additional={<WarnBox>{t("celo.delegation.earnRewards.warning")}</WarnBox>}
      footerLeft={<LinkWithExternalIcon label={t("delegation.howItWorks")} onClick={onLearnMore} />}
    />
  );
};

export default CeloEarnRewardsInfoModal;
