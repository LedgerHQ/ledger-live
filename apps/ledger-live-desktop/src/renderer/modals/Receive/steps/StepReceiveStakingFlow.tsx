import React, { useCallback, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

import { Flex, Text, Icons, Checkbox, Link } from "@ledgerhq/react-ui";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";

import { StepProps } from "../Body";
import StakingIllustration from "../assets/StakingIllustration";

import { openURL } from "~/renderer/linking";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";
import Button from "~/renderer/components/ButtonV3";
import perFamilyManageActions from "~/renderer/generated/AccountHeaderManageActions";

export const LOCAL_STORAGE_KEY_PREFIX = "receive_staking_";

const StepReceiveStakingFlow = (props: StepProps) => {
  const { t } = useTranslation();
  const receiveStakingFlowConfig = useFeature("receiveStakingFlowConfigDesktop");
  const [doNotShowAgain, setDoNotShowAgain] = useState<boolean>(false);
  const [action, setAction] = useState<object>({});
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const { account, parentAccount } = props;

  const id = account.currency.id;
  const supportLink = receiveStakingFlowConfig?.params[id]?.supportLink;
  const manage = perFamilyManageActions[account.currency.family];
  const familyManageActions = manage && manage({ account, parentAccount });

  useEffect(() => {
    const manageList =
      familyManageActions && familyManageActions.length > 0 ? familyManageActions : [];
    const newAction = manageList && manageList.find(item => item.key === "Stake");
    const provider = action?.provider?.liveAppId ? action?.provider?.liveAppId : "ledger";
    const altTitle = t(`receive.steps.staking.${id}.${provider}.title`);
    const newTitle =
      altTitle === `receive.steps.staking.${id}.${provider}.title`
        ? t(`receive.steps.staking.${id}.title`)
        : altTitle;
    const altDescription = t(`receive.steps.staking.${id}.${provider}.description`);
    const newDescription =
      altDescription === `receive.steps.staking.${id}.${provider}.description`
        ? t(`receive.steps.staking.${id}.description`)
        : altTitle;

    setTitle(newTitle);
    setDescription(newDescription);
    setAction(newAction);
  }, [action?.provider?.liveAppId, familyManageActions, id, t]);

  const openLink = useCallback(() => {
    openURL(supportLink);
  }, [supportLink]);

  const onChange = useCallback(
    value => {
      global.localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${id}`, value);
      setDoNotShowAgain(value);
    },
    [id],
  );

  return (
    <Flex flexDirection="column" justifyContent="center" alignItems="center" px={10}>
      <StakingIllustration />
      <Text variant="large" mb={6} mt={12} fontWeight="semiBold" textAlign="center">
        {title}
      </Text>
      <Text variant="paragraph" color="neutral.c70" textAlign="center">
        {description}
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
  const [action, setAction] = useState({});
  const { account, parentAccount, closeModal } = props;
  const manage = perFamilyManageActions[account.currency.family];
  const familyManageActions = manage && manage({ account, parentAccount });

  useEffect(() => {
    const manageList =
      familyManageActions && familyManageActions.length > 0 ? familyManageActions : [];
    const newAction = manageList && manageList.find(item => item.key === "Stake");
    setAction(newAction);
  }, [familyManageActions]);

  const onStake = useCallback(() => {
    if (action?.onClick) {
      closeModal();
      action.onClick();
    } else {
      // @TODO: redirect support link
      closeModal();
    }
  }, [action, closeModal]);
  return (
    <>
      <Button onClick={closeModal}>{t("receive.steps.staking.footer.dismiss")}</Button>
      <Button variant="color" onClick={onStake}>
        {t("receive.steps.staking.footer.stake", {
          provider: action?.provider?.name ? action?.provider?.name : "Ledger",
        })}
      </Button>
    </>
  );
};
export default withV3StyleProvider(StepReceiveStakingFlow);
