import React from "react";
import { Trans } from "react-i18next";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import Alert from "~/renderer/components/Alert";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
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
      <Box px={20}>
        <Text ff={"Inter|Medium"} textAlign={"center"} fontSize={22}>
          <Trans i18nKey="sign.description" />
        </Text>
        <Alert type="primary" mb={26} mt={12}>
          <Trans
            i18nKey="TransactionConfirm.doubleCheck"
            values={{ recipientWording: "TransactionConfirm.recipientWording.send" }}
          />
        </Alert>
      </Box>
    </>
  );
};
