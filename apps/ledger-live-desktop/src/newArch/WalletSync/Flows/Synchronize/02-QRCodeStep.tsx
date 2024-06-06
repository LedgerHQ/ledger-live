import React, { useEffect } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Box, Flex, Text } from "@ledgerhq/react-ui";
import styled, { useTheme } from "styled-components";
import NumberedList, { Item } from "@ledgerhq/react-ui/components/layout/List/NumberedList";

type Props = {
  displayPinCode: () => void;
};
export default function SynchWithQRCodeStep({ displayPinCode }: Props) {
  const { t } = useTranslation();

  const { colors } = useTheme();

  const steps: Item[] = [
    { element: t("walletSync.synchronize.qrCode.steps.step1") },
    { element: t("walletSync.synchronize.qrCode.steps.step2") },
    { element: t("walletSync.synchronize.qrCode.steps.step3") },
  ];

  // TO CHANGE WHEN INTRAGRATION WITH TRUSTCHAIN
  useEffect(() => {
    setTimeout(() => {
      displayPinCode();
    }, 3000);
  }, [displayPinCode]);

  return (
    <Flex flexDirection="column" rowGap="24px" alignItems="center" flex={1}>
      <Text
        fontSize={23}
        variant="large"
        fontWeight="semiBold"
        color="neutral.c100"
        textAlign="center"
      >
        {t("walletSync.synchronize.qrCode.title")}
      </Text>
      <Flex
        flexDirection="column"
        flex={1}
        rowGap="40px"
        alignItems="center"
        justifyContent="center"
      >
        <Box height={200} width={200} bg="neutral.c100"></Box>

        <MiddleContainer
          rowGap="24px"
          flexDirection="column"
          p={"24px"}
          backgroundColor={colors.opacityDefault.c05}
        >
          <Text fontSize={16} variant="large" fontWeight="500" color="neutral.c100">
            <Trans i18nKey="walletSync.synchronize.qrCode.description">
              <Text color="primary.c80" />
            </Trans>
          </Text>
          <NumberedList steps={steps} />
        </MiddleContainer>

        <Text fontSize={14} variant="paragraph" fontWeight="semiBold" color="neutral.c70">
          {t("walletSync.synchronize.qrCode.hint")}
        </Text>
      </Flex>
    </Flex>
  );
}

const MiddleContainer = styled(Flex)`
  border-radius: 12px;
`;
