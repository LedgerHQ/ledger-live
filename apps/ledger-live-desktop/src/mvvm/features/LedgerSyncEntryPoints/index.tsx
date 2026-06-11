import React from "react";
import { EntryPoint } from "./types";
import useLedgerSyncEntryPointViewModel from "./useLedgerSyncEntryPointViewModel";

type Props = ReturnType<typeof useLedgerSyncEntryPointViewModel>;

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
      onPress();
    } else {
      openDrawer();
    }
  };

  return entryPointComponent({ onPress: onClick });
}

const LedgerSyncEntryPoint = ({
  entryPoint,
  needEligibleDevice,
  onPress,
  variant,
}: {
  entryPoint: EntryPoint;
  needEligibleDevice?: boolean;
  onPress?: () => void;
  variant?: "v4";
}) => (
  <View
    {...useLedgerSyncEntryPointViewModel({ entryPoint, needEligibleDevice, onPress, variant })}
  />
);

export default LedgerSyncEntryPoint;
