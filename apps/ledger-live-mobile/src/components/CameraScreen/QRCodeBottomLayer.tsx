import React, { memo } from "react";
import { StyleSheet } from "react-native";
import { Trans } from "react-i18next";
import { Flex, Text, ProgressBar } from "@ledgerhq/native-ui";
import { rgba } from "../../colors";
import { softMenuBarHeight } from "../../logic/getWindowDimensions";

type Props = {
  progress?: number;
  liveQrCode?: boolean;
  instruction?: React.ReactNode | string;
};

function QrCodeBottomLayer({ progress, liveQrCode, instruction }: Props) {
  return (
    <Flex style={[styles.darken, { backgroundColor: rgba("#142533", 0.4) }, styles.centered]}>
      <Flex flex={1} alignItems="center" py={8} px={6}>
        <Text fontWeight="semiBold" variant="h3" textAlign="center" color="constant.white" mb={2}>
          {instruction || (
            <Trans
              i18nKey={liveQrCode ? "account.import.scan.descBottom" : "send.scan.descBottom"}
            />
          )}
        </Text>
        {progress !== undefined && progress > 0 && (
          <Flex width={104} mt={8} alignItems="center">
            <ProgressBar length={100} index={Math.floor((progress || 0) * 100)} />
            <Text mt={6} variant="large" color="constant.white">
              {Math.floor((progress || 0) * 100)}%
            </Text>
          </Flex>
        )}
        <Flex flex={1} />
      </Flex>
    </Flex>
  );
}

const styles = StyleSheet.create({
  darken: {
    flexGrow: 1,
    paddingBottom: softMenuBarHeight(),
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    color: "#fff",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    paddingTop: 8,
    paddingHorizontal: 16,
  },
});

export default memo<Props>(QrCodeBottomLayer);
