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

  const backgroundBorderRadius = 23;
  const backgroundPadding = 15.36;
  const backgroundSize = 280;
  const distanceBetweenQRCodeAndScreenBorder = 48;

  const QRSize = Math.round(width - distanceBetweenQRCodeAndScreenBorder);
  const maxQRCodeSize = backgroundSize - backgroundPadding * 2;
  const QRCodeSize = Math.min(QRSize - backgroundPadding, maxQRCodeSize);

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
        maxWidth={backgroundSize}
        maxHeight={backgroundSize}
        borderRadius={backgroundBorderRadius}
        background={colors.constant.white}
        justifyContent={"center"}
        testID="ws-qr-code-displayed"
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
