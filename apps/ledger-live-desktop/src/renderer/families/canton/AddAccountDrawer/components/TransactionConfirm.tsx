import React from "react";
import { Trans } from "react-i18next";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { Alert, Box, Text } from "@ledgerhq/react-ui";
import { renderVerifyUnwrapped } from "~/renderer/components/DeviceAction/rendering";
import useTheme from "~/renderer/hooks/useTheme";

interface TransactionConfirmProps {
  device: Device;
}

export const TransactionConfirm: React.FC<TransactionConfirmProps> = ({ device }) => {
  const { theme } = useTheme();
  return (
    <>
      {renderVerifyUnwrapped({ modelId: device.modelId, type: theme })}
      <Box px={10}>
        <Text ff="Inter|Medium" textAlign="center" fontSize={22}>
          <Trans i18nKey="sign.description" />
        </Text>
        <Alert
          type="info"
          containerProps={{ mb: 6, mt: 6, p: 24 }}
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
