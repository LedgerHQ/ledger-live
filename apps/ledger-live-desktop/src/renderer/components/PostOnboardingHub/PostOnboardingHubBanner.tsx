import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import styled from "styled-components";
import { Flex, Theme } from "@ledgerhq/react-ui";
import { hidePostOnboardingWalletEntryPoint } from "@ledgerhq/live-common/postOnboarding/actions";
import { getDeviceModel } from "@ledgerhq/devices";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { usePostOnboardingHubState } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import { useNavigateToPostOnboardingHubCallback } from "./logic/useNavigateToPostOnboardingHubCallback";
import Illustration from "~/renderer/components/Illustration";
import bannerStaxLight from "./assets/bannerStaxLight.svg";
import bannerStaxDark from "./assets/bannerStaxDark.svg";
import { track } from "~/renderer/analytics/segment";
import { Card } from "../Box";
import ActionCard from "../ContentCards/ActionCard";

const Wrapper = styled(Card)`
  background-color: ${p => p.theme.colors.opacityPurple.c10};
  margin: 20px 0px;
`;

const illustrations: { [key in DeviceModelId]: Record<Theme["theme"], unknown> | undefined } = {
  stax: {
    light: bannerStaxLight,
    dark: bannerStaxDark,
  },
  europa: {
    light: bannerStaxLight,
    dark: bannerStaxDark,
  },
  nanoS: undefined,
  nanoSP: undefined,
  nanoX: undefined,
  blue: undefined,
};

const PostOnboardingHubBanner = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigateToPostOnboardingHub = useNavigateToPostOnboardingHubCallback();
  const { deviceModelId } = usePostOnboardingHubState();

  const handleNavigateToPostOnboardingHub = useCallback(() => {
    track("button_clicked2", { button: "What’s next for your device", deviceModelId });
    navigateToPostOnboardingHub();
  }, [navigateToPostOnboardingHub, deviceModelId]);

  const handleHidePostOnboardingHubBanner = useCallback(() => {
    track("button_clicked2", { button: "Dismiss post onboarding banner", deviceModelId });
    dispatch(hidePostOnboardingWalletEntryPoint());
  }, [dispatch, deviceModelId]);

  return (
    <Wrapper>
      <ActionCard
        leftContent={
          deviceModelId && illustrations[deviceModelId] ? (
            <Flex
              alignItems="center"
              justifyContent="center"
              bg="neutral.c100"
              borderRadius="100%"
              p={1}
            >
              <Illustration lightSource={bannerStaxLight} darkSource={bannerStaxDark} size={30} />
            </Flex>
          ) : null
        }
        title={t("postOnboarding.postOnboardingBanner.title", {
          productName: getDeviceModel(deviceModelId ?? DeviceModelId.stax).productName,
        })}
        description={t("postOnboarding.postOnboardingBanner.description")}
        actions={{
          primary: {
            label: t("postOnboarding.postOnboardingBanner.link"),
            action: handleNavigateToPostOnboardingHub,
            dataTestId: "postonboarding-banner-entry-point",
          },
          dismiss: {
            label: t("postOnboarding.postOnboardingBanner.dismiss"),
            action: handleHidePostOnboardingHubBanner,
            dataTestId: "postonboarding-banner-entry-point-close-button",
          },
        }}
      />
    </Wrapper>
  );
};

export default PostOnboardingHubBanner;
