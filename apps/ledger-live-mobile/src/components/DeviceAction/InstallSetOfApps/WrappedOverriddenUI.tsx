import React from "react";
import { Flex, Text } from "@ledgerhq/native-ui";
import { Trans } from "react-i18next";

type Props = {
  children: JSX.Element;
  productName: string;
};

const WrappedOverriddenUI = ({ children, productName }: Props) => (
  <Flex style={{ height: "100%" }}>
    <Flex flex={1} alignItems="center" justifyContent="center">
      {children}
    </Flex>
    <Text textAlign="center" color="neutral.c70">
      <Trans
        i18nKey="installSetOfApps.ongoing.disclaimer"
        values={{ productName }}
      />
    </Text>
  </Flex>
);

export default WrappedOverriddenUI;
