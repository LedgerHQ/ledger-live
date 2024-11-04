import { Flex, ProgressLoader, Text } from "@ledgerhq/react-ui";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useHistory } from "react-router-dom";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { getStoreValue, setStoreValue } from "~/renderer/store";
import { useCustomPath } from "@ledgerhq/live-common/hooks/recoverFeatureFlag";
import { useTranslation } from "react-i18next";
import { RecoverBannerType } from "./types";
import ActionCard from "../ContentCards/ActionCard";
import { Card } from "../Box";
import styled from "styled-components";

enum LedgerRecoverSubscriptionStateEnum {
  BACKUP_DEVICE_CONNECTION = "BACKUP_DEVICE_CONNECTION",
  BACKUP_DONE = "BACKUP_DONE",
  BACKUP_VERIFY_IDENTITY = "BACKUP_VERIFY_IDENTITY",
  NO_SUBSCRIPTION = "NO_SUBSCRIPTION",
  STARGATE_SUBSCRIBE = "STARGATE_SUBSCRIBE",
}

const maxStepNumber = Object.keys(LedgerRecoverSubscriptionStateEnum).length;

const Wrapper = styled(Card)`
  background-color: ${p => p.theme.colors.opacityPurple.c10};
  margin: 20px 0;
`;

/**
 * @prop children: if a child is passed, it will be rendered instead of the default banner. this allows to do a passthroughs to have first the recover banner, then the rest of the content.
 */
export default function RecoverBanner({ children }: { children?: React.ReactNode }) {
  const [storageData, setStorageData] = useState<LedgerRecoverSubscriptionStateEnum>(
    LedgerRecoverSubscriptionStateEnum.NO_SUBSCRIPTION,
  );
  const [displayBannerData, setDisplayBannerData] = useState<boolean>();
  const [stepNumber, setStepNumber] = useState<number>(0);

  const recoverServices = useFeature("protectServicesDesktop");
  const recoverBannerIsEnabled = recoverServices?.params?.bannerSubscriptionNotification;
  const protectID = recoverServices?.params?.protectId ?? "protect-prod";

  const getStorageSubscriptionState = useCallback(async () => {
    const storage = await getStoreValue("SUBSCRIPTION_STATE", protectID);
    const displayBanner = await getStoreValue("DISPLAY_BANNER", protectID);
    setStorageData(storage as LedgerRecoverSubscriptionStateEnum);
    setDisplayBannerData(displayBanner === "true");
  }, [protectID]);

  useEffect(() => {
    getStorageSubscriptionState();
  }, [getStorageSubscriptionState]);

  const { t } = useTranslation();
  const history = useHistory();

  const recoverResumeActivatePath = useCustomPath(
    recoverServices,
    "resumeActivate",
    "lld-banner-unfinished-onboarding",
    "recover-launch",
  );

  const recoverBannerSelected: RecoverBannerType | undefined = useMemo(() => {
    let recoverBannerWording: RecoverBannerType;

    switch (storageData) {
      case LedgerRecoverSubscriptionStateEnum.NO_SUBSCRIPTION:
        setStepNumber(1);
        return undefined;
      case LedgerRecoverSubscriptionStateEnum.STARGATE_SUBSCRIBE:
        setStepNumber(2);
        recoverBannerWording = t("dashboard.recoverBanner.subscribeDone", { returnObjects: true });
        break;
      case LedgerRecoverSubscriptionStateEnum.BACKUP_VERIFY_IDENTITY:
        setStepNumber(3);
        recoverBannerWording = t("dashboard.recoverBanner.verifyIdentity", { returnObjects: true });
        break;
      case LedgerRecoverSubscriptionStateEnum.BACKUP_DEVICE_CONNECTION:
        setStepNumber(4);
        recoverBannerWording = t("dashboard.recoverBanner.connectDevice", { returnObjects: true });
        break;
      case LedgerRecoverSubscriptionStateEnum.BACKUP_DONE:
        setStepNumber(5);
        return undefined;
      default:
        setStepNumber(0);
        return undefined;
    }

    return recoverBannerWording;
  }, [storageData, t]);

  const onRedirectRecover = () => {
    if (recoverResumeActivatePath) {
      history.push(recoverResumeActivatePath);
    }
  };

  const onCloseBanner = () => {
    setStoreValue("DISPLAY_BANNER", "false", protectID);
    setDisplayBannerData(false);
  };

  const passthroughs = children || null;
  if (!recoverBannerIsEnabled || !recoverBannerSelected || !displayBannerData) return passthroughs;

  return (
    <Wrapper>
      <ActionCard
        leftContent={
          <Flex alignItems="center" justifyContent="center" ml={3} width={40}>
            <ProgressLoader
              progress={(stepNumber * 100) / maxStepNumber}
              radius={20}
              stroke={4}
              showPercentage={false}
            />
            <Text
              display="block"
              flex={1}
              textAlign="center"
              fontSize="12px"
              lineHeight="15px"
              fontWeight="medium"
            >
              {`${stepNumber}/${maxStepNumber - 1}`}
            </Text>
          </Flex>
        }
        title={recoverBannerSelected.title}
        description={recoverBannerSelected.description}
        actions={{
          primary: {
            label: recoverBannerSelected.primaryCta,
            action: onRedirectRecover,
          },
          dismiss: {
            label: recoverBannerSelected.secondaryCta,
            action: onCloseBanner,
          },
        }}
      />
    </Wrapper>
  );
}
