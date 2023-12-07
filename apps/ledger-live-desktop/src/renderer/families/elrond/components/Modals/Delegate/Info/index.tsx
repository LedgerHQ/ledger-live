import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import EarnRewardsInfoModal from "~/renderer/components/EarnRewardsInfoModal";
import WarnBox from "~/renderer/components/WarnBox";
import LinkWithExternalIcon from "~/renderer/components/LinkWithExternalIcon";
import { urls } from "~/config/urls";
import { openURL } from "~/renderer/linking";
import { openModal } from "~/renderer/actions/modals";
import { DelegationType } from "~/renderer/families/elrond/types";
import { ElrondAccount, ElrondProvider } from "@ledgerhq/live-common/families/elrond/types";

export interface Props {
  account: ElrondAccount;
  validators: Array<ElrondProvider>;
  delegations?: Array<DelegationType>;
}
const ElrondEarnRewardsInfoModal = (props: Props) => {
  const { account, validators, delegations } = props;
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const onNext = useCallback(() => {
    dispatch(
      openModal("MODAL_ELROND_DELEGATE", {
        account,
        validators,
        delegations,
      }),
    );
  }, [account, dispatch, validators, delegations]);
  const onLearnMore = useCallback(() => {
    openURL(urls.elrondStaking);
  }, []);
  return (
    <EarnRewardsInfoModal
      name="MODAL_ELROND_REWARDS_INFO"
      onNext={onNext}
      description={t("elrond.delegation.flow.steps.starter.description")}
      bullets={Array.from({
        length: 3,
      }).map((_, index) => t(`elrond.delegation.flow.steps.starter.bullet.${index}`))}
      additional={
        <WarnBox>{t("elrond.delegation.flow.steps.starter.warning.description")}</WarnBox>
      }
      currency="elrond"
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
