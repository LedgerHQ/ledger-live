import React from "react";
import { Text } from "@ledgerhq/native-ui";
import SettingsRow from "~/components/SettingsRow";
import EquipmentIdRow from "./EquipmentIdRow";

import SettingsNavigationScrollView from "../../SettingsNavigationScrollView";

export default function Information() {
  return (
    <SettingsNavigationScrollView>
      <EquipmentIdRow />
      <SettingsRow title={"JS Engine"}>
        <Text variant={"body"} fontWeight={"medium"} color={"primary.c80"}>
          {global.HermesInternal ? "Hermes" : "Jsc"}
        </Text>
      </SettingsRow>
    </SettingsNavigationScrollView>
  );
}
