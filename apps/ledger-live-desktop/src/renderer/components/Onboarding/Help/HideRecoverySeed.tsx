import React from "react";
import { useTranslation, Trans } from "react-i18next";
import { Flex, Text, Button, Icons } from "@ledgerhq/react-ui";
import styled from "styled-components";
import IconCross from "~/renderer/icons/Cross";
import IconCheck from "~/renderer/icons/Check";
import IconTriangleWarning from "~/renderer/icons/TriangleWarning";
import Color from "color";
import { ScrollArea } from "~/renderer/components/Onboarding/ScrollArea";

const RuleContainer = styled(Flex).attrs({
  flexDirection: "row",
  alignItems: "center",
  mb: 6,
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
  warning: {
    color: "#FF6E33",
    bgColor: Color("#FF6E33")
      .alpha(0.1)
      .toString(),
    Icon: IconTriangleWarning,
  },
};

type RuleProps = {
  type: "success" | "error" | "warning";
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

const HideRecoverySeedContainer = styled(Flex).attrs({
  flexDirection: "column",
  height: "100%",
})``;

// TODO: fix text styling props using design system (variant & fontWeight, no ff)
export function HideRecoverySeed(props: { handleNextInDrawer: () => void }) {
  const { t } = useTranslation();

  return (
    <>
      <ScrollArea isInsideDrawer>
        <HideRecoverySeedContainer>
          <Text mb="32px" color="palette.text.shade100" variant="h3">
            {t("onboarding.drawers.whereToHide.title")}
          </Text>
          <Rule type="error">
            <Trans i18nKey="onboarding.drawers.whereToHide.points.1">
              <Text ff="Inter|Bold" />
            </Trans>
          </Rule>
          <Rule type="error">
            <Trans i18nKey="onboarding.drawers.whereToHide.points.2">
              <Text ff="Inter|Bold" />
            </Trans>
          </Rule>
          <Rule type="success">
            <Trans i18nKey="onboarding.drawers.whereToHide.points.3">
              <Text ff="Inter|Bold" />
            </Trans>
          </Rule>
          <Rule type="warning">
            <Trans i18nKey="onboarding.drawers.whereToHide.points.4">
              <Text ff="Inter|Bold" />
            </Trans>
          </Rule>
          <Rule type="warning">
            <Trans i18nKey="onboarding.drawers.whereToHide.points.5">
              <Text ff="Inter|Bold" />
            </Trans>
          </Rule>
        </HideRecoverySeedContainer>
      </ScrollArea>
      <Button
        data-test-id="v3-hide-seed-drawer"
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
