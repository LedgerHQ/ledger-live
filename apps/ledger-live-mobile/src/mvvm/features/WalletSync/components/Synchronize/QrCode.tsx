import React from "react";
import { Image } from "react-native";
import { Flex, InfiniteLoader, Text } from "@ledgerhq/native-ui";
import styled, { useTheme } from "styled-components/native";
import { QrCode as StyledQrCode } from "@shared/ui-qr-code";
import getWindowDimensions from "~/logic/getWindowDimensions";
import { Trans, useTranslation } from "~/context/Locale";
import BottomContainer, { INSTRUCTIONS_MAX_HEIGHT } from "./BottomContainer";
import {
  QR_CODE_TAB_CAPTION_HEIGHT,
  QR_CODE_TAB_FRAME_SIZE,
  QR_CODE_TAB_ROW_GAP,
} from "./QrCodeTabCaption";

const Italic = styled(Text)`
  font-style: italic;
`;
// Won't work since we don't have inter italic font

const LOGO_SIZE = 65;

type Props = {
  qrCodeValue?: string | null;
};

const QrCode = ({ qrCodeValue }: Props) => {
  const { colors } = useTheme();
  const { width } = getWindowDimensions();
  const { t } = useTranslation();

  const backgroundBorderRadius = 23;
  const backgroundPadding = 15.36;
  const backgroundSize = 280;
  const distanceBetweenQRCodeAndScreenBorder = 48;

  // An explicit size rather than a height capped by maxHeight, which the sheet measured uncapped.
  const QRSize = Math.min(Math.round(width - distanceBetweenQRCodeAndScreenBorder), backgroundSize);
  const maxQRCodeSize = backgroundSize - backgroundPadding * 2;
  const QRCodeSize = Math.min(QRSize - backgroundPadding, maxQRCodeSize);
  // The box takes the room of the scan tab's taller frame and caption row, so its bottom stays put.
  const instructionsMaxHeight =
    INSTRUCTIONS_MAX_HEIGHT +
    (QR_CODE_TAB_FRAME_SIZE - QRSize) +
    QR_CODE_TAB_CAPTION_HEIGHT +
    QR_CODE_TAB_ROW_GAP;

  const steps = [
    {
      description: (
        <Text variant="body" flex={1} fontSize={14} color={colors.opacityDefault.c70}>
          {t("walletSync.synchronize.qrCode.show.explanation.steps.step1")}
        </Text>
      ),
    },
    {
      description: (
        <Text variant="body" flex={1} fontSize={14} color={colors.opacityDefault.c70}>
          {t("walletSync.synchronize.qrCode.show.explanation.steps.step2")}
        </Text>
      ),
    },
    {
      description: (
        <Text variant="body" flex={1} fontSize={14} color={colors.opacityDefault.c70}>
          <Trans
            i18nKey="walletSync.synchronize.qrCode.show.explanation.steps.step3"
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
        <Text variant="body" flex={1} fontSize={14} color={colors.opacityDefault.c70}>
          {t("walletSync.synchronize.qrCode.show.explanation.steps.step4")}
        </Text>
      ),
    },
  ];

  return (
    <Flex
      minHeight={400}
      justifyContent={"center"}
      alignItems={"center"}
      rowGap={QR_CODE_TAB_ROW_GAP}
    >
      <Flex
        alignItems={"center"}
        width={QRSize}
        height={QRSize}
        borderRadius={backgroundBorderRadius}
        background={colors.constant.white}
        justifyContent={"center"}
        testID="ws-qr-code-displayed"
      >
        {qrCodeValue ? (
          <StyledQrCode
            value={qrCodeValue}
            size={QRCodeSize}
            foregroundColor={colors.constant.black}
            testID="ws-qr-code"
            centerContent={
              <Image
                source={require("~/images/bigSquareLogo.webp")}
                style={{ width: LOGO_SIZE, height: LOGO_SIZE }}
              />
            }
          />
        ) : (
          <InfiniteLoader size={65} />
        )}
      </Flex>
      <BottomContainer steps={steps} maxHeight={instructionsMaxHeight} />
    </Flex>
  );
};

export default QrCode;
