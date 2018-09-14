// @flow
import React from "react";
// $FlowFixMe
import { Buffer } from "buffer";
import { withNavigation } from "react-navigation";
import GreyButton from "./GreyButton";

const ImportBridgeStreamData = ({
  title,
  reboot,
  navigation,
  dataStr,
  ...rest
}: {
  title: string,
  navigation: *,
  reboot: *,
  dataStr: *,
}) => (
  <GreyButton
    {...rest}
    title={title}
    onPress={() => {
      const data = JSON.parse(Buffer.from(dataStr, "base64").toString("utf8"));
      navigation.navigate("ImportAccounts", { data });
    }}
  />
);

export default withNavigation(ImportBridgeStreamData);
