import React from "react";
import { Trans } from "react-i18next";
import { Text, Alert } from "@ledgerhq/react-ui";

export function UTXOAddressAlert() {
  return (
    <Alert
      type={"info"}
      containerProps={{ p: 12, borderRadius: 8 }}
      renderContent={() => (
        <Text
          variant="paragraphLineHeight"
          fontWeight="semiBold"
          color="neutral.c100"
          fontSize={13}
        >
          <Trans i18nKey="currentAddress.utxoWarning" />
        </Text>
      )}
    />
  );
}
