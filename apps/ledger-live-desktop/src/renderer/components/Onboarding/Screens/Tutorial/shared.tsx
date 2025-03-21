import React from "react";
import { useTranslation } from "react-i18next";
import styled, { DefaultTheme, StyledComponent } from "styled-components";
import { Box, Text, Flex, Icon, Switch } from "@ledgerhq/react-ui";
import { BoxProps } from "@ledgerhq/react-ui/components/layout/Box/index";
import { SwitchProps } from "@ledgerhq/react-ui/components/form/Switch/index";
import { TextProps } from "@ledgerhq/react-ui/components/asorted/Text/index";

export const WaveContainer: StyledComponent<"div", DefaultTheme, BoxProps> = styled(Box).attrs({
  position: "absolute",
  left: "0",
  right: "0",
  top: "0",
  height: "500px",
})`
  pointer-events: none;
`;

export const AnimationContainer: StyledComponent<"div", DefaultTheme, BoxProps> = styled(Flex)`
  overflow-x: clip;
  width: 324px;
  > * {
    transform: scale(1.3);
    margin-left: 70px;
  }
`;

export const IllustrationContainer: StyledComponent<
  "div",
  DefaultTheme,
  BoxProps & { src: string }
> = styled(Flex)<{ src: string }>`
  // prettier-ignore
  background: url('${({ src }) => src}') no-repeat center;
  background-size: contain;
`;

export const Title = (props: TextProps & { children?: React.ReactNode }) => (
  <Text variant="h2" mb={12} {...props} />
);

export const SubTitle = (props: TextProps & { children?: React.ReactNode }) => (
  <Text variant="body" mb={2} color="palette.neutral.c80" {...props} />
);

export const BorderFlex: StyledComponent<"div", DefaultTheme, BoxProps> = styled(Flex)`
  border: 1px solid ${p => p.theme.colors.palette.neutral.c40};
  border-radius: 4px;
`;

export const IconContainer: StyledComponent<"div", DefaultTheme, BoxProps> = styled(
  BorderFlex,
).attrs({
  width: 60,
  height: 60,
  flexDirection: "row",
  justifyContent: "center",
  alignItems: "center",
})`
  color: ${p => p.theme.colors.palette.neutral.c100};
`;

export const Row: StyledComponent<"div", DefaultTheme, BoxProps> = styled(Flex).attrs({
  flexDirection: "row",
  justifyContent: "flex-start",
  alignItems: "center",
})``;

export const Column: StyledComponent<"div", DefaultTheme, BoxProps> = styled(Flex).attrs({
  flexDirection: "column",
  justifyContent: "flex-start",
  alignItems: "stretch",
})``;

export const Bullet = ({
  icon,
  bulletText,
  text,
  subText,
}: {
  icon?: string;
  bulletText?: string | number | null;
  text: React.ReactNode;
  subText?: React.ReactNode;
}) => {
  return (
    <Row mb={8}>
      <IconContainer>
        {icon ? <Icon name={icon} size={18} color="palette.neutral.c100" /> : bulletText}
      </IconContainer>
      <Column flex="1" ml={4}>
        <Text variant="body">{text}</Text>
        {subText && (
          <Text mt={2} variant="small" color="palette.neutral.c80">
            {subText}
          </Text>
        )}
      </Column>
    </Row>
  );
};

export const CheckStep = ({
  checked,
  label,
  ...props
}: {
  checked: boolean;
  label: React.ReactNode;
  onClick: SwitchProps["onChange"];
}) => (
  <BorderFlex mt={12} p={4} {...props} width="fit-content" alignItems="center">
    <Switch onChange={props.onClick} name="checkbox" checked={checked} size="normal" />
    <Text ml={4} flex="1" variant="body">
      {label}
    </Text>
  </BorderFlex>
);

const Footer = styled(Column).attrs({ flex: "1", p: 8 })`
  border-top: 1px solid ${p => p.theme.colors.palette.constant.black};
  cursor: pointer;
`;

export const AsideFooter = ({ text, ...props }: { text: string }) => {
  const { t } = useTranslation();
  return (
    <Footer {...props}>
      <Row mb={4}>
        <Text mr={2} variant="large" color="palette.constant.black">
          {t("common.needHelp")}
        </Text>
        <Icon name="LifeRing" size={18} color="palette.constant.black" />
      </Row>
      <Text variant="small" color="palette.constant.black">
        {text}
      </Text>
    </Footer>
  );
};
