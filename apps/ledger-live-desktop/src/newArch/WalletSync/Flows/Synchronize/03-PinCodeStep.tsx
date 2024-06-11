import React from "react";
import { useTranslation } from "react-i18next";
import { Flex, Text } from "@ledgerhq/react-ui";
import styled, { useTheme } from "styled-components";

export default function PinCodeStep() {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const PIN_CODE = [1, 5, 7];

  return (
    <Flex flexDirection="column" rowGap="16px" justifyContent="center" flex={1}>
      <Text
        fontSize={24}
        variant="large"
        fontWeight="semiBold"
        color="neutral.c100"
        textAlign="center"
      >
        {t("walletSync.synchronize.pinCode.title")}
      </Text>

      <Text fontSize={14} variant="body" fontWeight="500" color="neutral.c70" textAlign="center">
        {t("walletSync.synchronize.pinCode.description")}
      </Text>

      <Flex flexDirection="row" justifyContent="center" columnGap="12px" mt={"16px"}>
        {PIN_CODE.map((number, index) => (
          <NumberContainer
            key={index}
            backgroundColor={colors.opacityDefault.c05}
            alignItems="center"
            justifyContent="center"
          >
            <Text fontSize={14} variant="body" fontWeight="medium" color="neutral.c100">
              {number}
            </Text>
          </NumberContainer>
        ))}
      </Flex>
    </Flex>
  );
}

const NumberContainer = styled(Flex)`
  border-radius: 8px;
  height: 50px;
  width: 50px;
`;
