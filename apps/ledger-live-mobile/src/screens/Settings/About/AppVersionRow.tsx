import React from "react";
import { Trans } from "react-i18next";
import { Text } from "@ledgerhq/native-ui";
import SettingsRow from "~/components/SettingsRow";
import getFullAppVersion from "~/logic/version";

function AppVersionRow() {
  const version = getFullAppVersion();
  return (
    <SettingsRow event="AppVersionRow" title={<Trans i18nKey="settings.about.appVersion" />}>
      <Text variant={"body"} fontWeight={"medium"} color={"primary.c80"}>
        {version}
      </Text>
    </SettingsRow>
  );
}

export default AppVersionRow;
