import React from "react";
import { EntryPoint } from "./types";
import useLedgerSyncEntryPointViewModel from "./useLedgerSyncEntryPointViewModel";
import ActivationDrawer from "../WalletSync/screens/Activation/ActivationDrawer";
import { Steps } from "../WalletSync/types/Activation";

type Props = ReturnType<typeof useLedgerSyncEntryPointViewModel>;

function View({
  page,
  shouldDisplayEntryPoint,
  entryPointComponent,
  onClickEntryPoint,
  isActivationDrawerVisible,
  openActivationDrawer,
  closeActivationDrawer,
}: Props) {
  if (!shouldDisplayEntryPoint) {
    return null;
  }

  const onPress = () => {
    onClickEntryPoint({ page });
    openActivationDrawer();
  };

  return (
    <>
      {entryPointComponent({ onPress })}
      <ActivationDrawer
        startingStep={Steps.Activation}
        isOpen={isActivationDrawerVisible}
        handleClose={closeActivationDrawer}
      />
    </>
  );
}

const LedgerSyncEntryPoint = ({ entryPoint, page }: { entryPoint: EntryPoint; page: string }) => (
  <View {...useLedgerSyncEntryPointViewModel({ entryPoint, page })} />
);

export default LedgerSyncEntryPoint;
