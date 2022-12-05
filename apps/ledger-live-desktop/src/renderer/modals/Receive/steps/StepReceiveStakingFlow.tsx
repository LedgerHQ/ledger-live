import React, { useCallback, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

import { Flex, Text, Icons, Link } from "@ledgerhq/react-ui";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";

import { StepProps } from "../Body";
import StakingIllustration from "../assets/StakingIllustration";

import { track } from "~/renderer/analytics/segment";
import { openURL } from "~/renderer/linking";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";
import Button from "~/renderer/components/ButtonV3";
import CheckBox from "~/renderer/components/CheckBox";
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

    const provider = newAction?.provider?.liveAppId ? newAction?.provider?.liveAppId : "ledger";
    const altTitle = t(`receive.steps.staking.${id}.${provider}.title`);
    const newTitle =
      altTitle === `receive.steps.staking.${id}.${provider}.title`
        ? t(`receive.steps.staking.${id}.title`)
        : altTitle;
    const altDescription = t(`receive.steps.staking.${id}.${provider}.description`);
    const newDescription =
      altDescription === `receive.steps.staking.${id}.${provider}.description`
        ? t(`receive.steps.staking.${id}.description`)
        : altDescription;
    if (JSON.stringify(title) !== JSON.stringify(newTitle)) {
      setTitle(newTitle);
    }
    if (JSON.stringify(description) !== JSON.stringify(newDescription)) {
      setDescription(newDescription);
    }
    if (JSON.stringify(action) !== JSON.stringify(newAction)) {
      setAction(newAction);
    }
  }, [action, description, familyManageActions, id, t, title]);

  const getTrackProperties = useCallback(() => {
    return {
      page: window.location.hash
        .split("/")
        .filter(e => e !== "#")
        .join("/"),
      modal: "receive",
      flow: "stake",
    };
  }, []);

  const openLink = useCallback(() => {
    track("button_clicked", {
      button: "learn_more",
      ...getTrackProperties(),
      link: supportLink,
    });
    openURL(supportLink, "OpenURL", getTrackProperties());
  }, [getTrackProperties, supportLink]);

  const onChange = useCallback(() => {
    const value = !doNotShowAgain;
    global.localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${id}`, value);
    setDoNotShowAgain(value);
    track("button_clicked", {
      button: "not_show",
      ...getTrackProperties(),
      value,
    });
  }, [doNotShowAgain, getTrackProperties, id]);

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
      <Flex
        p={6}
        borderColor="neutral.c50"
        borderRadius={2}
        borderWidth={1}
        borderStyle={"solid"}
        onClick={onChange}
      >
        <CheckBox isChecked={doNotShowAgain} label={t("receive.steps.staking.notShow")} />
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
    if (JSON.stringify(newAction) !== JSON.stringify(action)) {
      setAction(newAction);
    }
  }, [action, familyManageActions]);

  const getTrackProperties = useCallback(() => {
    return {
      page: window.location.hash
        .split("/")
        .filter(e => e !== "#")
        .join("/"),
      flow: "stake",
      currency: account?.currency?.name,
      provider: action?.provider?.name || "Ledger",
      modal: "receive",
      account,
    };
  }, [account, action?.provider?.name]);

  const onStake = useCallback(() => {
    if (action?.onClick) {
      track("button_clicked", {
        button: "stake",
        ...getTrackProperties(),
      });

      closeModal();
      action.onClick();
    } else {
      closeModal();
    }
  }, [action, closeModal, getTrackProperties]);

  const onCloseModal = useCallback(() => {
    track("button_clicked", {
      button: "skip",
      ...getTrackProperties(),
    });
    closeModal();
  }, [closeModal, getTrackProperties]);

  return (
    <>
      <Button onClick={onCloseModal}>{t("receive.steps.staking.footer.dismiss")}</Button>
      <Button variant="color" onClick={onStake}>
        {t("receive.steps.staking.footer.stake", {
          provider: action?.provider?.name ? action?.provider?.name : "Ledger",
        })}
      </Button>
    </>
  );
};
export default withV3StyleProvider(StepReceiveStakingFlow);
