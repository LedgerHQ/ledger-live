import React, { useCallback, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Flex, Text, IconsLegacy, Link } from "@ledgerhq/react-ui";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { StepProps } from "../Body";
import StakingIllustration from "../assets/StakingIllustration";
import { track } from "~/renderer/analytics/segment";
import { openURL } from "~/renderer/linking";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";
import Button from "~/renderer/components/ButtonV3";
import CheckBox from "~/renderer/components/CheckBox";
import { getAccountName } from "@ledgerhq/live-common/account/index";
import { Account } from "@ledgerhq/types-live";
import { getLLDCoinFamily } from "~/renderer/families";
import { ManageAction } from "~/renderer/families/types";

export const LOCAL_STORAGE_KEY_PREFIX = "receive_staking_";

export const CheckBoxContainer: typeof Flex = styled(Flex)`
  & > div {
    column-gap: 15px;
  }
  & span {
    font-size: 14px;
    line-height: 18px;
  }
  border-radius: 8px;
  background-color: ${p => p.theme.colors.neutral.c30};
  :hover {
    background-color: ${p => p.theme.colors.primary.c10};
  }
`;

const StepReceiveStakingFlow = (props: StepProps) => {
  const { t } = useTranslation();
  const receiveStakingFlowConfig = useFeature("receiveStakingFlowConfigDesktop");
  const [doNotShowAgain, setDoNotShowAgain] = useState<boolean>(false);
  // FIXME action is not used?
  const [action, setAction] = useState<ManageAction | undefined>();
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const { account, parentAccount } = props;

  const id = account && "currency" in account ? account.currency?.id : undefined;
  const supportLink = id ? receiveStakingFlowConfig?.params[id]?.supportLink : undefined;

  const manage =
    account && account.type === "Account"
      ? getLLDCoinFamily(account.currency.family).accountHeaderManageActions
      : null;

  const familyManageActions =
    account && manage ? manage({ account: account as Account, parentAccount }) : undefined;

  useEffect(() => {
    const manageList =
      familyManageActions && familyManageActions.length > 0 ? familyManageActions : [];
    const newAction = manageList && manageList.find(item => item.key === "Stake");
    const newTitle = t(`receive.steps.staking.${id}.title`);
    const newDescription = t(`receive.steps.staking.${id}.description`);
    // FIXME fix this code. https://ledgerhq.atlassian.net/browse/LIVE-7343
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
    global.localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${id}`, "" + value);
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
        <Link Icon={IconsLegacy.ExternalLinkMedium} onClick={openLink} mt={7} mb={7} type={"color"}>
          {t("receive.steps.staking.link")}
        </Link>
      )}
      <CheckBoxContainer p={6} borderRadius={8} borderWidth={0} width={"100%"} onClick={onChange}>
        <CheckBox isChecked={doNotShowAgain} label={t("receive.steps.staking.notShow")} />
      </CheckBoxContainer>
    </Flex>
  );
};

const providerName = "Ledger";

export const StepReceiveStakingFooter = (props: StepProps) => {
  const { t } = useTranslation();
  const [action, setAction] = useState<ManageAction | undefined>();
  const { account, parentAccount, closeModal } = props;
  const specific =
    account && account.type === "Account" ? getLLDCoinFamily(account.currency.family) : null;
  const manage = specific?.accountHeaderManageActions;
  const familyManageActions =
    manage && account && manage({ account: account as Account, parentAccount });

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
      currency: account && "currency" in account ? account?.currency?.name : undefined,
      provider: providerName,
      modal: "receive",
      account: account && getAccountName(account),
    };
  }, [account]);

  const onStake = useCallback(() => {
    if (action && "onClick" in action && action?.onClick) {
      track("button_clicked", {
        button: "stake",
        ...getTrackProperties(),
      });

      closeModal();
      (action.onClick as () => void)();
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
          provider: providerName,
        })}
      </Button>
    </>
  );
};
export default withV3StyleProvider(StepReceiveStakingFlow);
