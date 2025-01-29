import React from "react";
import SafeAreaView from "~/components/SafeAreaView";
import Activation from "../../components/Activation";
import ActivationDrawer from "./ActivationDrawer";
import { Steps } from "../../types/Activation";
import { NavigatorName, ScreenName } from "~/const";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { WalletSyncNavigatorStackParamList } from "~/components/RootNavigator/types/WalletSyncNavigator";
import { useNavigation } from "@react-navigation/native";

type NavigationProps = BaseComposite<
  StackNavigatorProps<WalletSyncNavigatorStackParamList, ScreenName.WalletSyncActivationProcess>
>;

function View() {
  const [showDrawer, setShowDrawer] = React.useState(false);
  const navigation = useNavigation<NavigationProps["navigation"]>();

  const onCreateKey = () => {
    navigation.navigate(NavigatorName.WalletSync, {
      screen: ScreenName.WalletSyncActivationProcess,
    });
  };

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
      <Activation onSyncMethodPress={onCreateKey} navigateToChooseSyncMethod={onOpenDrawer} />

      <ActivationDrawer
        startingStep={Steps.ChooseSyncMethod}
        isOpen={showDrawer}
        handleClose={onCloseDrawer}
      />
    </SafeAreaView>
  );
}

const WalletSyncActivation = () => <View />;

export default WalletSyncActivation;
