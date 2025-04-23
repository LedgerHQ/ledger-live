import { Box, Flex, Icons, Text } from "@ledgerhq/react-ui";
import React from "react";
import styled, { useTheme } from "styled-components";
import ButtonV3 from "~/renderer/components/ButtonV3";

export type GenericProps = {
  title?: string;
  description?: string;
  withClose?: boolean;
  withCta?: boolean;
  onClick?: () => void;
  onClose?: () => void;
  type?: "success" | "info";
  specificCta?: string;
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

const BottomContainer = styled(Flex)``;

export const GenericStatusDisplay = ({
  title,
  description,
  withClose = false,
  withCta = false,
  onClose,
  type,
}: GenericProps) => {
  const { colors } = useTheme();

  return (
    <Flex flexDirection="column" alignItems="center" justifyContent="center" rowGap="24px">
      <Container>
        {type === "info" ? (
          <Icons.InformationFill size={"L"} color={colors.primary.c60} />
        ) : (
          <Icons.CheckmarkCircleFill size={"L"} color={colors.success.c60} />
        )}
      </Container>
      <Text fontSize={24} variant="h4Inter" color="neutral.c100" textAlign="center">
        {title}
      </Text>
      <Text variant="bodyLineHeight" color="neutral.c70" textAlign="center">
        {description}
      </Text>

      {withClose || withCta ? (
        <BottomContainer
          mb={3}
          width={"100%"}
          px={"40px"}
          flexDirection="column"
          justifyContent="center"
          rowGap={"16px"}
        >
          {withClose && (
            <ButtonV3 variant="shade" onClick={onClose} flex={1}>
              Hodl Shield activarted
            </ButtonV3>
          )}
        </BottomContainer>
      ) : null}
    </Flex>
  );
};
