import { Box, Flex, Icons, Text } from "@ledgerhq/react-ui";
import React from "react";
import styled, { useTheme } from "styled-components";
import ButtonV3 from "~/renderer/components/ButtonV3";

type Props = {
  title?: string;
  description?: string;
  cta?: string;
  onClick?: () => void;
};

const Container = styled(Box)`
  background-color: ${p => p.theme.colors.opacityDefault.c05};
  border-radius: 100%;
  height: 72px;
  width: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const Error = ({ title, description, cta, onClick }: Props) => {
  const { colors } = useTheme();
  return (
    <Flex flexDirection="column" alignItems="center" justifyContent="center" rowGap="24px">
      <Container>
        <Icons.DeleteCircleFill size={"L"} color={colors.error.c60} />
      </Container>
      <Text fontSize={24} variant="h4Inter" color="neutral.c100" textAlign="center">
        {title}
      </Text>
      <Text variant="bodyLineHeight" color="neutral.c70" textAlign="center">
        {description}
      </Text>
      {cta && onClick && (
        <ButtonV3 variant="shade" onClick={onClick}>
          {cta}
        </ButtonV3>
      )}
    </Flex>
  );
};
