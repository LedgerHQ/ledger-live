import React from "react";
import type { SettingsDeveloperProps } from "./SettingsDeveloper.types";
import { SettingsDeveloperView } from "./SettingsDeveloperView";
import { useSettingsDeveloperViewModel } from "./useSettingsDeveloperViewModel";

export function SettingsDeveloper(props: SettingsDeveloperProps) {
  return <SettingsDeveloperView {...useSettingsDeveloperViewModel(props)} />;
}
