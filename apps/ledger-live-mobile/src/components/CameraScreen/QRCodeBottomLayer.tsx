import React, { memo } from "react";
import { Trans } from "react-i18next";
import { Text, ProgressBar, NumberedList, Box } from "@ledgerhq/native-ui";
import { rgba } from "../../colors";
import { useTheme } from "styled-components/native";

type Props = {
  progress?: number;
  liveQrCode?: boolean;
  instruction?: React.ReactNode | string;
};

function QrCodeBottomLayer({ progress, liveQrCode, instruction }: Props) {
  const { colors } = useTheme();

  return (
    <Box
      backgroundColor={rgba(colors.constant.black, 0.4)}
      borderRadius={2}
      pt={6}
      pb={6}
      px={6}
      mt={"auto"}
      mx={6}
      mb={7}
    >
      <Text variant={"h5"} fontWeight={"semiBold"} mb={6}>
        {instruction || (
          <Trans i18nKey={liveQrCode ? "account.import.newScan.title" : "send.scan.descBottom"} />
        )}
      </Text>
      {liveQrCode && (
        <>
          {progress !== undefined && progress > 0 ? (
            <Box>
              <Text variant={"body"} color={"neutral.c80"} mb={6}>
                <Trans i18nKey={"account.import.newScan.hodl"} />
              </Text>
              <ProgressBar
                length={100}
                index={Math.floor((progress || 0) * 100)}
                bg={"neutral.c40"}
                height={8}
                borderRadius={2}
                activeBarProps={{ bg: "primary.c80", borderRadius: 2 }}
              />
            </Box>
          ) : (
            <NumberedList
              items={[
                {
                  description: <Trans i18nKey={"account.import.newScan.instructions.line1"} />,
                },
                {
                  description: <Trans i18nKey={"account.import.newScan.instructions.line2"} />,
                },
                {
                  description: <Trans i18nKey={"account.import.newScan.instructions.line3"} />,
                },
              ]}
              itemContainerProps={{ mb: 3 }}
            />
          )}
        </>
      )}
    </Box>
  );
}

export default memo<Props>(QrCodeBottomLayer);
