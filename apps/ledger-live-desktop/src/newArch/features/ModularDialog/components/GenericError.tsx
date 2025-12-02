import { Flex, Icons, Text } from "@ledgerhq/react-ui";
import React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import ButtonV3 from "~/renderer/components/ButtonV3";

type Props = { onClick: () => void };

export const GenericError = ({ onClick }: Props) => {
  const { t } = useTranslation();

  return (
    <Container>
      <Icons.DeleteCircleFill size="M" color={"palette.error.c70"} />
      <Content>
        <Title>{t("modularAssetDrawer.genericError.title")}</Title>
        <Description>{t("modularAssetDrawer.genericError.description")}</Description>
        <Flex>
          <ButtonV3 variant="error" onClick={onClick}>
            <Cta>{t("modularAssetDrawer.genericError.cta")}</Cta>
          </ButtonV3>
        </Flex>
      </Content>
    </Container>
  );
};

const Container = styled.div`
  padding: 16px;
  width: 100%;
  border-radius: 12px;
  display: flex;
  flex-direction: row;
  background-color: ${p => p.theme.colors.palette.error.c70a02};
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  margin-left: 8px;
  flex-shrink: 1;
`;

const Title = styled(Text)`
  font-size: 16px;
  font-weight: 600;
  color: ${p => p.theme.colors.palette.text.shade100};
  margin-bottom: 4px;
`;

const Description = styled(Text)`
  font-size: 14px;
  font-weight: 500;
  color: ${p => p.theme.colors.palette.text.shade100};
  margin-bottom: 12px;
`;

const Cta = styled(Text)`
  font-size: 14px;
  font-weight: 600;
  color: ${p => p.theme.colors.palette.constant.white};
`;
