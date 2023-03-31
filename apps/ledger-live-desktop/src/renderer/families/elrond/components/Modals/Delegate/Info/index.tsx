import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import EarnRewardsInfoModal from "~/renderer/components/EarnRewardsInfoModal";
import WarnBox from "~/renderer/components/WarnBox";
import LinkWithExternalIcon from "~/renderer/components/LinkWithExternalIcon";
import { urls } from "~/config/urls";
import { openURL } from "~/renderer/linking";
import { modals } from "~/renderer/families/elrond/modals";
import { openModal, closeModal } from "~/renderer/actions/modals";
import { Account } from "@ledgerhq/types-live";
import { DelegationType, ElrondProvider } from "~/renderer/families/elrond/types";
interface Props {
  name: string;
  account: Account;
  parentAccount?: Account;
  validators: Array<ElrondProvider>;
  delegations: Array<DelegationType>;
}
const ElrondEarnRewardsInfoModal = (props: Props) => {
  const { name, account, parentAccount, validators, delegations } = props;
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const onNext = useCallback(() => {
    dispatch(closeModal(name));
    dispatch(
      openModal(modals.stake, {
        parentAccount,
        account,
        validators,
        delegations,
      }),
    );
  }, [parentAccount, account, dispatch, validators, delegations, name]);
  const onLearnMore = useCallback(() => {
    openURL(urls.elrondStaking);
  }, []);
  return (
    <EarnRewardsInfoModal
      name={name}
      onNext={onNext}
      description={t("elrond.delegation.flow.steps.starter.description")}
      bullets={Array.from({
        length: 3,
      }).map((_, index) => t(`elrond.delegation.flow.steps.starter.bullet.${index}`))}
      additional={
        <WarnBox>{t("elrond.delegation.flow.steps.starter.warning.description")}</WarnBox>
      }
      footerLeft={
        <LinkWithExternalIcon
          label={t("elrond.delegation.emptyState.info")}
          onClick={onLearnMore}
        />
      }
    />
  );
};
export default ElrondEarnRewardsInfoModal;
