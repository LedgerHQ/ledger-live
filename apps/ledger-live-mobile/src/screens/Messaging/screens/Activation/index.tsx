import React from "react";
import SafeAreaView from "~/components/SafeAreaView";
import ActivationDrawer from "./ActivationDrawer";
import { Steps } from "../../types/Activation";
import { ScreenName } from "~/const";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { WalletSyncNavigatorStackParamList } from "~/components/RootNavigator/types/WalletSyncNavigator";
import { useNavigation } from "@react-navigation/native";

type NavigationProps = BaseComposite<
  StackNavigatorProps<WalletSyncNavigatorStackParamList, ScreenName.WalletSyncActivationProcess>
>;

function View() {
  const [showDrawer, setShowDrawer] = React.useState(true);
  const navigation = useNavigation<NavigationProps["navigation"]>();

  const onCloseDrawer = () => {
    setShowDrawer(false);
    navigation.navigate(ScreenName.ConversationList, {});
  };

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
      <ActivationDrawer
        startingStep={Steps.QrCodeMethod}
        isOpen={showDrawer}
        handleClose={onCloseDrawer}
      />
    </SafeAreaView>
  );
}

const WalletSyncActivation = () => <View />;

export default WalletSyncActivation;
