import React from "react";
import { Trans } from "react-i18next";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { Account } from "@ledgerhq/types-live";
import Alert from "~/renderer/components/Alert";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import SignMessageConfirm from "~/renderer/components/SignMessageConfirm";

interface TransactionConfirmProps {
  account: Account;
  device: Device;
  message: string;
}

export const TransactionConfirm: React.FC<TransactionConfirmProps> = ({
  account,
  device,
  message,
}) => (
  <>
    <SignMessageConfirm
      device={device}
      account={account}
      parentAccount={null}
      signMessageRequested={{ message }}
    />
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
