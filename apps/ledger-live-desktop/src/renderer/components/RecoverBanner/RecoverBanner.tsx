import { Flex, ProgressLoader, Text, Icons } from "@ledgerhq/react-ui";
import React, { useMemo } from "react";
import { useNavigate } from "react-router";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useCustomPath } from "@ledgerhq/live-common/hooks/recoverFeatureFlag";
import { useTranslation } from "react-i18next";
import { RecoverBannerType } from "./types";
import ActionCard from "../ContentCards/ActionCard";
import { Card } from "../Box";
import styled from "styled-components";
import { LedgerRecoverSubscriptionStateEnum } from "~/types/recoverSubscriptionState";
import useTheme from "~/renderer/hooks/useTheme";
import { useRecoverBannerState } from "~/renderer/hooks/useRecoverBannerState";

const maxStepNumber = Object.keys(LedgerRecoverSubscriptionStateEnum).length;

const Wrapper = styled(Card)`
  background-color: ${p => p.theme.colors.opacityPurple.c10};
  margin: 20px 0;
`;

/**
 * @prop children: if a child is passed, it will be rendered instead of the default banner. this allows to do a passthroughs to have first the recover banner, then the rest of the content.
 */
export default function RecoverBanner({ children }: { children?: React.ReactNode }) {
  const { colors } = useTheme();

  const recoverServices = useFeature("protectServicesDesktop");
  const recoverBannerIsEnabled = recoverServices?.params?.bannerSubscriptionNotification;
  const protectID = recoverServices?.params?.protectId ?? "protect-prod";
  const { data, dismissBanner } = useRecoverBannerState(protectID);

  const { t } = useTranslation();
  const navigate = useNavigate();

  const recoverResumeActivatePath = useCustomPath(
    recoverServices,
    "resumeActivate",
    "lld-banner-unfinished-onboarding",
    "recover-launch",
  );

  const { recoverBannerSelected, stepNumber } = useMemo<{
    recoverBannerSelected?: RecoverBannerType;
    stepNumber: number;
  }>(() => {
    let recoverBannerWording: RecoverBannerType;

    switch (data.subscriptionState) {
      case LedgerRecoverSubscriptionStateEnum.NO_SUBSCRIPTION:
        return { stepNumber: 1 };
      case LedgerRecoverSubscriptionStateEnum.STARGATE_SUBSCRIBE:
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        recoverBannerWording = t("dashboard.recoverBanner.subscribeDone", {
          returnObjects: true,
        }) as RecoverBannerType;
        return { recoverBannerSelected: recoverBannerWording, stepNumber: 2 };
      case LedgerRecoverSubscriptionStateEnum.BACKUP_VERIFY_IDENTITY:
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        recoverBannerWording = t("dashboard.recoverBanner.verifyIdentity", {
          returnObjects: true,
        }) as RecoverBannerType;
        return { recoverBannerSelected: recoverBannerWording, stepNumber: 3 };
      case LedgerRecoverSubscriptionStateEnum.BACKUP_DEVICE_CONNECTION:
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        recoverBannerWording = t("dashboard.recoverBanner.connectDevice", {
          returnObjects: true,
        }) as RecoverBannerType;
        return { recoverBannerSelected: recoverBannerWording, stepNumber: 4 };
      case LedgerRecoverSubscriptionStateEnum.BACKUP_DONE:
        return { stepNumber: 5 };
      default:
        return { stepNumber: 0 };
    }
  }, [data.subscriptionState, t]);

  const onRedirectRecover = () => {
    if (recoverResumeActivatePath) {
      navigate(recoverResumeActivatePath);
    }
  };

  const onCloseBanner = () => {
    dismissBanner();
  };

  const passthroughs = children || null;
  if (!recoverBannerIsEnabled || !recoverBannerSelected || !data.displayBanner) return passthroughs;

  const isWarning = stepNumber > 2;

  return (
    <Wrapper>
      <ActionCard
        leftContent={
          <Flex alignItems="center" justifyContent="center" ml={3} width={40} height={40}>
            <ProgressLoader
              progress={(stepNumber * 100) / maxStepNumber}
              radius={20}
              stroke={4}
              showPercentage={false}
              frontStrokeColor={isWarning ? colors.warning.c70 : undefined}
            />
            {isWarning ? (
              <Icons.WarningFill color="warning.c70" size="XS" />
            ) : (
              <Text
                className="flex items-center justify-center h-full"
                textAlign="center"
                fontSize="12px"
                lineHeight="15px"
                fontWeight="medium"
              >
                {`${stepNumber}/${maxStepNumber - 1}`}
              </Text>
            )}
          </Flex>
        }
        title={recoverBannerSelected.title}
        description={recoverBannerSelected.description}
        actions={{
          primary: {
            label: recoverBannerSelected.primaryCta,
            action: onRedirectRecover,
          },
          ...(recoverBannerSelected.secondaryCta
            ? {
                dismiss: {
                  label: recoverBannerSelected.secondaryCta,
                  action: onCloseBanner,
                },
              }
            : {}),
        }}
      />
    </Wrapper>
  );
}
