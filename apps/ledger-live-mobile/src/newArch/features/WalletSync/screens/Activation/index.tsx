import React from "react";
import SafeAreaView from "~/components/SafeAreaView";
import Activation from "../../components/Activation";

function View() {
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
      <Activation />
    </SafeAreaView>
  );
}

const WalletSyncActivation = () => <View />;

export default WalletSyncActivation;
