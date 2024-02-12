import React, { useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import { DeviceSelectorWrapper, Wrapper, Content, Title, Subtitle, Illustration } from "./shared";
import illustration from "~/renderer/images/USBTroubleshooting/fail.png";
import { DeviceSelector } from "~/renderer/components/Onboarding/Screens/SelectDevice/DeviceSelector";
import { openURL } from "~/renderer/linking";
import { urls } from "~/config/urls";
import RepairDeviceButton from "~/renderer/components/RepairDeviceButton";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";
const RepairFunnelSolution = ({
  sendEvent,
  done,
}: {
  sendEvent: (b: string, a?: {} | null) => void;
  done: boolean;
}) => {
  const { t } = useTranslation();
  const repairRef = useRef<HTMLButtonElement>(null);
  const contactSupportUrl = useLocalizedUrl(urls.contactSupport);
  const onContactSupport = () => {
    openURL(contactSupportUrl);
  };
  const onBack = useCallback(() => {
    sendEvent("PREVIOUS");
  }, [sendEvent]);
  const onSelectDevice = useCallback(
    (deviceModel: string) => {
      if (deviceModel === "nanoS") {
        // NB click forwarded into the repair button.
        repairRef.current?.click();
      } else {
        sendEvent("DONE", {
          deviceModel,
        });
      }
    },
    [repairRef, sendEvent],
  );
  const onRepairDeviceClose = useCallback(
    ({ needHelp }: { needHelp?: boolean }) => {
      if (needHelp) {
        sendEvent("DONE", {
          deviceModel: "nanoS",
        });
      }
    },
    [sendEvent],
  );
  return !done ? (
    <Wrapper>
      <Title>{t("connectTroubleshooting.steps.4.deviceSelection.title")}</Title>
      <div
        style={{
          display: "none",
        }}
      >
        <RepairDeviceButton disableDescription ref={repairRef} onClose={onRepairDeviceClose} />
      </div>
      <DeviceSelectorWrapper>
        <DeviceSelector onClick={onSelectDevice} />
      </DeviceSelectorWrapper>
    </Wrapper>
  ) : (
    <Wrapper>
      <Content>
        <Illustration height={193} image={illustration} />
      </Content>
      <Title>{t("connectTroubleshooting.steps.4.notFixed.title")}</Title>
      <Subtitle
        style={{
          padding: "0 50px",
        }}
        mb={36}
        mt={12}
      >
        {t("connectTroubleshooting.steps.4.notFixed.desc")}
      </Subtitle>
      <Box horizontal>
        <Button secondary onClick={onBack} mr={2}>
          {t("connectTroubleshooting.steps.4.notFixed.cta2")}
        </Button>
        <Button primary onClick={onContactSupport}>
          {t("connectTroubleshooting.steps.4.notFixed.cta")}
        </Button>
      </Box>
    </Wrapper>
  );
};
export default RepairFunnelSolution;
