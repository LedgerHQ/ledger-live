import React from "react";
import { EntryPoint } from "./types";
import useLedgerSyncEntryPointViewModel from "./useLedgerSyncEntryPointViewModel";

type Props = ReturnType<typeof useLedgerSyncEntryPointViewModel>;

function View({
  shouldDisplayEntryPoint,
  entryPointComponent,
  entryPointVariant,
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

  return entryPointComponent({ onPress: onClick, variant: entryPointVariant });
}

const LedgerSyncEntryPoint = ({
  entryPoint,
  needEligibleDevice,
  onPress,
}: {
  entryPoint: EntryPoint;
  needEligibleDevice?: boolean;
  onPress?: () => void;
}) => <View {...useLedgerSyncEntryPointViewModel({ entryPoint, needEligibleDevice, onPress })} />;

export default LedgerSyncEntryPoint;
