import React from "react";
import { Text } from "@ledgerhq/native-ui";
import SettingsRow from "~/components/SettingsRow";
import EquipmentIdRow from "./EquipmentIdRow";

import SettingsNavigationScrollView from "../../SettingsNavigationScrollView";

interface GlobalExtensions {
  HermesInternal?: unknown;
}

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
const g = globalThis as unknown as GlobalExtensions & typeof globalThis;

export default function Information() {
  return (
    <SettingsNavigationScrollView>
      <EquipmentIdRow />
      <SettingsRow title={"JS Engine"}>
        <Text variant={"body"} fontWeight={"medium"} color={"primary.c80"}>
          {g.HermesInternal ? "Hermes" : "Jsc"}
        </Text>
      </SettingsRow>
    </SettingsNavigationScrollView>
  );
}
