import React from "react";
import { Flex, Text, NumberedList, ScrollContainer } from "@ledgerhq/native-ui";
import styled, { useTheme } from "styled-components/native";
import QRCode from "react-native-qrcode-svg";
import getWindowDimensions from "~/logic/getWindowDimensions";
import { Trans, useTranslation } from "react-i18next";

const Italic = styled(Text)`
  font-style: italic;
`;
// Won't work since we don't have inter italic font

type Props = {
  qrCodeValue: string;
};

const QrCode = ({ qrCodeValue }: Props) => {
  const { colors } = useTheme();
  const { width } = getWindowDimensions();
  const { t } = useTranslation();

  const QRSize = Math.round(width - 48);
  const maxQRCodeSize = 280 - 15.36 * 2;
  const QRCodeSize = Math.min(QRSize - 15.36, maxQRCodeSize);

  const steps = [
    {
      description: (
        <Text variant="body" flex={1} ml={12} fontSize={14} color={colors.opacityDefault.c70}>
          {t("walletSync.synchronize.qrCode.show.explanation.steps.step1")}
        </Text>
      ),
    },
    {
      description: (
        <Text variant="body" flex={1} ml={12} fontSize={14} color={colors.opacityDefault.c70}>
          <Trans
            i18nKey="walletSync.synchronize.qrCode.show.explanation.steps.step2"
            components={[
              <Italic key={0} color={colors.opacityDefault.c70} />,
              <Text key={1} color={colors.opacityDefault.c30} />,
            ]}
          />
        </Text>
      ),
    },
    {
      description: (
        <Text variant="body" flex={1} ml={12} fontSize={14} color={colors.opacityDefault.c70}>
          {t("walletSync.synchronize.qrCode.show.explanation.steps.step3")}
        </Text>
      ),
    },
  ];

  return (
    <Flex
      flexDirection={"column"}
      rowGap={24}
      alignItems={"center"}
      marginBottom={20}
      width={"100%"}
      height={"100%"}
    >
      <Flex
        alignItems={"center"}
        width={QRSize}
        height={QRSize}
        maxWidth={280}
        maxHeight={280}
        borderRadius={11.52}
        background={"#fff"}
        justifyContent={"center"}
        testID="ws-show-qr-code"
      >
        <QRCode
          value={qrCodeValue}
          logo={require("~/images/bigSquareLogo.png")}
          logoSize={65}
          size={QRCodeSize}
        />
      </Flex>
      <ScrollContainer
        px={16}
        mb={10}
        width={"100%"}
        maxHeight={280}
        background={colors.opacityDefault.c05}
        borderRadius={24}
        showsVerticalScrollIndicator={false}
      >
        <Text variant="h4" fontSize={18} color={colors.neutral.c100} my={24}>
          {t("walletSync.synchronize.qrCode.show.explanation.title")}
        </Text>
        <NumberedList items={steps} />
      </ScrollContainer>
    </Flex>
  );
};

export default QrCode;
