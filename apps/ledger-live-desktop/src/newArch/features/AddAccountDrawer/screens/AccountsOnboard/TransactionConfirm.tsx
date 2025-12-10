import { Alert, Box, Text } from "@ledgerhq/react-ui";
import React from "react";
import { Trans } from "react-i18next";
import { renderVerifyUnwrapped } from "~/renderer/components/DeviceAction/rendering";
import useTheme from "~/renderer/hooks/useTheme";
import { TransactionConfirmComponent } from "./types";

const TransactionConfirm: TransactionConfirmComponent = ({ device }) => {
  const { colors } = useTheme();
  return (
    <>
      {renderVerifyUnwrapped({ modelId: device.modelId, type: colors.palette.type })}
      <Box px={20}>
        <Text ff={"Inter|Medium"} textAlign={"center"} fontSize={22}>
          <Trans i18nKey="sign.description" />
        </Text>
        <Alert
          type="info"
          containerProps={{ mb: 26, mt: 12 }}
          renderContent={() => (
            <Trans
              i18nKey="TransactionConfirm.doubleCheck"
              values={{ recipientWording: "TransactionConfirm.recipientWording.send" }}
            />
          )}
        />
      </Box>
    </>
  );
};

export default TransactionConfirm;
