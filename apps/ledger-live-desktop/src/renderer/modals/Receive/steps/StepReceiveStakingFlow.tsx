import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { Flex, Text, Icons, Checkbox, Link } from "@ledgerhq/react-ui";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";

import { StepProps } from "../Body";
import StakingIllustration from "../assets/StakingIllustration";

import { openURL } from "~/renderer/linking";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";
import Button from "~/renderer/components/ButtonV3";
import perFamilyManageActions from "~/renderer/generated/AccountHeaderManageActions";

const StepReceiveStakingFlow = (props: StepProps) => {
  const { t } = useTranslation();
  const receiveStakingFlowConfig = useFeature("receiveStakingFlowConfigDesktop");
  const [doNotShowAgain, setDoNotShowAgain] = useState<boolean>(false);
  const { account } = props;

  const id = account.currency.id;
  const supportLink = receiveStakingFlowConfig?.params[id]?.supportLink;

  const openLink = useCallback(() => {
    openURL(supportLink);
  }, [supportLink]);

  const onChange = useCallback(() => {
    setDoNotShowAgain((state: boolean) => !state);
  }, []);

  return (
    <Flex flexDirection="column" justifyContent="center" alignItems="center" px={10}>
      <StakingIllustration />
      <Text variant="large" mb={6} mt={12} fontWeight="semiBold" textAlign="center">
        {t(`receive.steps.staking.${id}.title`)}
      </Text>
      <Text variant="paragraph" color="neutral.c70" textAlign="center">
        {t(`receive.steps.staking.${id}.description`)}
      </Text>
      {supportLink && (
        <Link Icon={Icons.ExternalLinkMedium} onClick={openLink} mt={7} mb={7} type={"color"}>
          {t("receive.steps.staking.link")}
        </Link>
      )}
      <Flex p={6} borderColor="neutral.c50" borderRadius={2} borderWidth={1} borderStyle={"solid"}>
        <Checkbox
          label={t("receive.steps.staking.notShow")}
          isChecked={doNotShowAgain}
          name="checkbox"
          onChange={onChange}
        />
      </Flex>
    </Flex>
  );
};

export const StepReceiveStakingFooter = (props: StepProps) => {
  const { t } = useTranslation();
  const { account, parentAccount, closeModal } = props;
  const manage = perFamilyManageActions[account.currency.family];

  const familyManageActions = manage && manage({ account, parentAccount });

  const onStake = useCallback(() => {
    const manageList =
      familyManageActions && familyManageActions.length > 0 ? familyManageActions : [];
    const action = manageList && manageList.find(item => item.key === "Stake");
    if (action?.onClick) {
      closeModal();
      action.onClick();
    } else {
      // @TODO: redirect support link
      closeModal();
    }
  }, [familyManageActions, closeModal]);
  return (
    <>
      <Button onClick={closeModal}>{t("receive.steps.staking.footer.dismiss")}</Button>
      <Button variant="color" onClick={onStake}>
        {t("receive.steps.staking.footer.stake", { provider: "Ledger" })}
      </Button>
    </>
  );
};
export default withV3StyleProvider(StepReceiveStakingFlow);
