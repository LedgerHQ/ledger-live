import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { getDeviceModel } from "@ledgerhq/devices";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { usePostOnboardingHubState } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import { useNavigateToPostOnboardingHubCallback } from "./logic/useNavigateToPostOnboardingHubCallback";
import { track } from "~/renderer/analytics/segment";
import { Card } from "../Box";
import ActionCard from "../ContentCards/ActionCard";
import StaxBannerIllustration from "./StaxBannerIllustration";
import EuropaBannerIllustration from "./EuropaBannerIllustration";

const Wrapper = styled(Card)`
  background-color: ${p => p.theme.colors.opacityPurple.c10};
  margin: 20px 0px;
`;

const illustrations = {
  stax: <StaxBannerIllustration />,
  europa: <EuropaBannerIllustration />,
  nanoS: undefined,
  nanoSP: undefined,
  nanoX: undefined,
  blue: undefined,
  apex: undefined,
};

const PostOnboardingHubBanner = () => {
  const { t } = useTranslation();
  const navigateToPostOnboardingHub = useNavigateToPostOnboardingHubCallback();
  const { deviceModelId } = usePostOnboardingHubState();

  const handleNavigateToPostOnboardingHub = useCallback(() => {
    track("button_clicked2", { button: "What’s next for your device", deviceModelId });
    navigateToPostOnboardingHub();
  }, [navigateToPostOnboardingHub, deviceModelId]);

  return (
    <Wrapper>
      <ActionCard
        leftContent={deviceModelId ? illustrations[deviceModelId] : undefined}
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
        }}
      />
    </Wrapper>
  );
};

export default PostOnboardingHubBanner;
