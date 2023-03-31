import React from "react";
import { useTranslation, Trans } from "react-i18next";
import { Flex, Text, Button, Icons } from "@ledgerhq/react-ui";
import styled from "styled-components";
import IconCross from "~/renderer/icons/Cross";
import IconCheck from "~/renderer/icons/Check";
import { ScrollArea } from "~/renderer/components/Onboarding/ScrollArea";
import Color from "color";

const RuleContainer = styled(Flex).attrs({
  flexDirection: "row",
  marginBottom: "16px",
  alignItems: "center",
})``;

const RuleIconContainer = styled(Flex).attrs({
  width: "28px",
  height: "28px",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "50%",
})``;

const ruleTypes = {
  success: {
    color: "#66BE54",
    bgColor: Color("#66BE54")
      .alpha(0.1)
      .toString(),
    Icon: IconCheck,
  },
  error: {
    color: "#EA2E49",
    bgColor: Color("#EA2E49")
      .alpha(0.1)
      .toString(),
    Icon: IconCross,
  },
};

type RuleProps = {
  type: "success" | "error";
  children: unknown;
};

function Rule({ type, children }: RuleProps) {
  const RuleIcon = ruleTypes[type].Icon;
  return (
    <RuleContainer>
      <RuleIconContainer
        style={{
          color: ruleTypes[type].color,
          backgroundColor: ruleTypes[type].bgColor,
        }}
      >
        <RuleIcon size={12} />
      </RuleIconContainer>
      <Text
        ml="16px"
        color="palette.text.shade100"
        ff="Inter|Regular"
        fontSize={13}
        style={{ flex: 1 }}
      >
        {children}
      </Text>
    </RuleContainer>
  );
}

const PinHelpContainer = styled(Flex).attrs({
  flexDirection: "column",
  height: "100%",
})``;

export function PinHelp(props: { handleNextInDrawer: () => void }) {
  const { t } = useTranslation();

  return (
    <>
      <ScrollArea isInsideDrawer>
        <PinHelpContainer>
          <Text color="palette.text.shade100" variant="h3">
            {t("onboarding.drawers.pinHelp.title")}
          </Text>
          <Text mt="8px" mb="32px" color="palette.text.shade100" ff="Inter|Regular" fontSize={14}>
            {t("onboarding.drawers.pinHelp.intro")}
          </Text>
          <Rule type="success">
            <Trans i18nKey="onboarding.drawers.pinHelp.rules.1">
              <Text ff="Inter|Bold" />
            </Trans>
          </Rule>
          <Rule type="success">
            <Trans i18nKey="onboarding.drawers.pinHelp.rules.2">
              <Text ff="Inter|Bold" />
            </Trans>
          </Rule>
          <Rule type="success">{t("onboarding.drawers.pinHelp.rules.3")}</Rule>
          <Rule type="success">{t("onboarding.drawers.pinHelp.rules.4")}</Rule>
          <Rule type="error">
            <Trans i18nKey="onboarding.drawers.pinHelp.rules.5">
              <Text ff="Inter|Bold" />
            </Trans>
          </Rule>
          <Rule type="error">
            <Trans i18nKey="onboarding.drawers.pinHelp.rules.6">
              <Text ff="Inter|Bold" />
            </Trans>
          </Rule>
          <Rule type="error">
            <Trans i18nKey="onboarding.drawers.pinHelp.rules.7">
              <Text ff="Inter|Bold" />
            </Trans>
          </Rule>
          <Rule type="error">
            <Trans i18nKey="onboarding.drawers.pinHelp.rules.8">
              <Text ff="Inter|Bold" />
            </Trans>
          </Rule>
        </PinHelpContainer>
      </ScrollArea>
      <Button
        data-test-id="v3-pin-code-drawer"
        mt="auto"
        left="-258px"
        width="248px"
        variant="main"
        onClick={props.handleNextInDrawer}
        Icon={() => <Icons.ArrowRightMedium size={18} />}
      >
        {t("onboarding.screens.welcome.nextButton")}
      </Button>
    </>
  );
}
