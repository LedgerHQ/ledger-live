// @flow
import React from "react";
// $FlowFixMe
import { Buffer } from "buffer";
import { withNavigation } from "react-navigation";
import SettingsRow from "../../../components/SettingsRow";

const ImportBridgeStreamData = ({
  title,
  navigation,
  dataStr,
}: {
  title: string,
  navigation: *,
  reboot: *,
  dataStr: *,
}) => (
  <SettingsRow
    title={title}
    onPress={() => {
      const data = JSON.parse(Buffer.from(dataStr, "base64").toString("utf8"));
      navigation.navigate("ImportAccounts", { data });
    }}
  />
);

export default withNavigation(ImportBridgeStreamData);
