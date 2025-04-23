import React from "react";
import { EntryPoint } from "./types";
import useHodlShieldEntryPointViewModel from "./useHodlShieldEntryPointViewModel";

type Props = ReturnType<typeof useHodlShieldEntryPointViewModel>;

function View({
  shouldDisplayEntryPoint,
  entryPointComponent,
  onClickEntryPoint,
  openDrawer,
  onPress,
}: Props) {
  if (!shouldDisplayEntryPoint) {
    return null;
  }

  const onClick = () => {
    onClickEntryPoint();
    if (onPress) {
      console.log("onPress");
      onPress();
    } else {
      console.log("openDrawer");
      openDrawer();
    }
  };

  return entryPointComponent({ onPress: onClick });
}

const HodlShieldEntryPoint = ({
  entryPoint,
  needEligibleDevice,
  onPress,
}: {
  entryPoint: EntryPoint;
  needEligibleDevice?: boolean;
  onPress?: () => void;
}) => <View {...useHodlShieldEntryPointViewModel({ entryPoint, needEligibleDevice, onPress })} />;

export default HodlShieldEntryPoint;
