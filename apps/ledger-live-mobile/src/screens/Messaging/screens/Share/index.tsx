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

function WalletSyncActivation({ route }) {
  const [showDrawer, setShowDrawer] = React.useState(true);
  const navigation = useNavigation<NavigationProps["navigation"]>();
  const onCloseDrawer = () => {
    setShowDrawer(false);
    navigation.navigate(ScreenName.Conversation, {
      conversationId: route.params.conversationId,
      name: route.params.name,
    });
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
        conversationId={route.params.conversationId}
      />
    </SafeAreaView>
  );
}

export default WalletSyncActivation;
