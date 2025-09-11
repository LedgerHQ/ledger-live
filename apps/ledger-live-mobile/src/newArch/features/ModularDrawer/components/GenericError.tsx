import { Flex, Icons, Text, Button } from "@ledgerhq/native-ui";
import React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components/native";

type Props = { onClick?: () => void; type: "backend" | "internet" };

export const GenericError = ({ onClick, type }: Props) => {
  const { t } = useTranslation();

  return (
    <Container p={6} flexDirection="row">
      <Icons.DeleteCircleFill size="M" color={"error.c70"} />
      <Content ml={3}>
        <Title mb={2}>{t("modularDrawer.errors.title")}</Title>
        <Description mb={4}>{t(`modularDrawer.errors.${type}`)}</Description>

        {onClick && (
          <Button type="error" onPress={onClick} alignSelf="flex-start">
            <Cta>{t("modularDrawer.errors.cta")}</Cta>
          </Button>
        )}
      </Content>
    </Container>
  );
};

const Container = styled(Flex)`
  border-radius: 12px;
  background-color: ${p => p.theme.colors.error.c70a02};
`;

const Content = styled(Flex)``;

const Title = styled(Text)`
  font-size: 16px;
  font-weight: 600;
  color: ${p => p.theme.colors.neutral.c100};
`;

const Description = styled(Text)`
  font-size: 14px;
  font-weight: 500;
  color: ${p => p.theme.colors.neutral.c100};
`;

const Cta = styled(Text)`
  font-size: 14px;
  font-weight: 600;
  color: ${p => p.theme.colors.constant.white};
`;
