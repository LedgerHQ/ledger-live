import React from "react";
import { Flex, Box, Text, NumberedList } from "@ledgerhq/native-ui";
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
    { description: t("walletSync.synchronize.qrCode.show.explanation.steps.step1") },
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
    { description: t("walletSync.synchronize.qrCode.show.explanation.steps.step3") },
  ];

  return (
    <Flex flexDirection={"column"} rowGap={50} alignItems={"center"} width={"100%"}>
      <Flex
        alignItems={"center"}
        width={QRSize}
        height={QRSize}
        maxWidth={280}
        maxHeight={280}
        borderRadius={11.52}
        background={"#fff"}
        justifyContent={"center"}
      >
        <QRCode value={qrCodeValue} logo={require("./logo.png")} logoSize={65} size={QRCodeSize} />
      </Flex>
      <Box
        px={16}
        pt={24}
        width={"100%"}
        background={colors.opacityDefault.c05}
        borderRadius={24}
        display={"flex"}
        flexDirection={"column"}
        rowGap={24}
      >
        <Text variant="h4" fontSize={18} color={colors.neutral.c100}>
          {t("walletSync.synchronize.qrCode.show.explanation.title")}
        </Text>
        <NumberedList maxHeight={180} items={steps} />
      </Box>
    </Flex>
  );
};

export default QrCode;
