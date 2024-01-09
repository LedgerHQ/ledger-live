import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { CeloAccount } from "@ledgerhq/live-common/families/celo/types";
import { SubAccount } from "@ledgerhq/types-live";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { urls } from "~/config/urls";
import { openModal } from "~/renderer/actions/modals";

import EarnRewardsInfoModal from "~/renderer/components/EarnRewardsInfoModal";
import LinkWithExternalIcon from "~/renderer/components/LinkWithExternalIcon";
import WarnBox from "~/renderer/components/WarnBox";
import { openURL } from "~/renderer/linking";
import { ModalsData } from "../modals";

export type Props = {
  account: CeloAccount | SubAccount;
  parentAccount: CeloAccount | undefined | null;
};
const CeloEarnRewardsInfoModal = ({ account, parentAccount }: Props) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const onNext = useCallback(() => {
    if (getMainAccount(account, parentAccount).celoResources?.registrationStatus) {
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
  }, [parentAccount, account, dispatch]);
  const onLearnMore = useCallback(() => {
    openURL(urls.celo.learnMore);
  }, []);
  return (
    <EarnRewardsInfoModal<keyof ModalsData>
      name="MODAL_CELO_REWARDS_INFO"
      onNext={onNext}
      description={t("celo.delegation.earnRewards.description")}
      bullets={[
        t("celo.delegation.earnRewards.bullet.0"),
        t("celo.delegation.earnRewards.bullet.1"),
        t("celo.delegation.earnRewards.bullet.2"),
      ]}
      currency="celo"
      additional={<WarnBox>{t("celo.delegation.earnRewards.warning")}</WarnBox>}
      footerLeft={<LinkWithExternalIcon label={t("delegation.howItWorks")} onClick={onLearnMore} />}
    />
  );
};

export default CeloEarnRewardsInfoModal;
