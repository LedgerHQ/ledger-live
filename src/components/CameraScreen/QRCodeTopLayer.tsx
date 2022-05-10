import { Alert, Flex, Text } from "@ledgerhq/native-ui";
import { Trans } from "react-i18next";
import React from "react";

type Props = {
  liveQrCode?: boolean;
};

const QRCodeTopLayer = ({ liveQrCode }: Props) => (
  <Flex flex={1} alignItems="center" py={8} px={6}>
    {liveQrCode ? (
      <Alert type="info">
        <Flex>
          <Text fontWeight="semiBold" variant="body">
            <Trans i18nKey="account.import.scan.descTop.line1" />
          </Text>
          <Text fontWeight="bold" variant="body">
            <Trans i18nKey="account.import.scan.descTop.line2" />
          </Text>
        </Flex>
      </Alert>
    ) : null}
  </Flex>
);

export default QRCodeTopLayer;
