import React from "react";
import SafeAreaView from "~/components/SafeAreaView";
import Activation from "../../components/Activation";
import ActivationDrawer from "./ActivationDrawer";
import { Steps } from "../../types/Activation";

function View() {
  const [showDrawer, setShowDrawer] = React.useState(false);

  const onOpenDrawer = () => setShowDrawer(true);
  const onCloseDrawer = () => setShowDrawer(false);

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      isFlex
      style={{
        flexDirection: "column",
        gap: 26,
        marginHorizontal: 24,
        marginTop: 114,
      }}
    >
      <Activation onSyncMethodPress={onOpenDrawer} />
      {showDrawer && (
        <ActivationDrawer
          startingStep={Steps.ChooseSyncMethod}
          isOpen={showDrawer}
          handleClose={onCloseDrawer}
        />
      )}
    </SafeAreaView>
  );
}

const WalletSyncActivation = () => <View />;

export default WalletSyncActivation;
