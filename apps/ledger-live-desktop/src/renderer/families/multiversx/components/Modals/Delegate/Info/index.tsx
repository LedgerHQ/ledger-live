import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import EarnRewardsInfoModal from "~/renderer/components/EarnRewardsInfoModal";
import WarnBox from "~/renderer/components/WarnBox";
import LinkWithExternalIcon from "~/renderer/components/LinkWithExternalIcon";
import { urls } from "~/config/urls";
import { openURL } from "~/renderer/linking";
import { openModal } from "~/renderer/actions/modals";
import { DelegationType } from "~/renderer/families/multiversx/types";
import {
  MultiversXAccount,
  MultiversXProvider,
} from "@ledgerhq/live-common/families/multiversx/types";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";

export interface Props {
  account: MultiversXAccount;
  validators: Array<MultiversXProvider>;
  delegations?: Array<DelegationType>;
}
const MultiversXEarnRewardsInfoModal = (props: Props) => {
  const { account, validators, delegations } = props;
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const onNext = useCallback(() => {
    dispatch(
      openModal("MODAL_MULTIVERSX_DELEGATE", {
        account,
        validators,
        delegations,
      }),
    );
  }, [account, dispatch, validators, delegations]);

  const multiversxUrl = useLocalizedUrl(urls.multiversxStaking);
  const onLearnMore = () => {
    openURL(multiversxUrl);
  };
  return (
    <EarnRewardsInfoModal
      name="MODAL_MULTIVERSX_REWARDS_INFO"
      onNext={onNext}
      description={t("elrond.delegation.flow.steps.starter.description")}
      bullets={Array.from({
        length: 3,
      }).map((_, index) => t(`elrond.delegation.flow.steps.starter.bullet.${index}`))}
      additional={
        <WarnBox>{t("elrond.delegation.flow.steps.starter.warning.description")}</WarnBox>
      }
      currency="multiversx"
      footerLeft={
        <LinkWithExternalIcon
          label={t("elrond.delegation.emptyState.info")}
          onClick={onLearnMore}
        />
      }
    />
  );
};
export default MultiversXEarnRewardsInfoModal;
