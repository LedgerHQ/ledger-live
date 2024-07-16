import React, { useCallback, useEffect } from "react";
import QueuedDrawer from "LLM/components/QueuedDrawer";
import { TrackScreen } from "~/analytics";
import FollowInstructions from "../../components/FollowInstructions";
import { useNavigation } from "@react-navigation/core";
import { NavigatorName, ScreenName } from "~/const";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { WalletSyncNavigatorStackParamList } from "~/components/RootNavigator/types/WalletSyncNavigator";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
};

type NavigationProps = BaseComposite<
  StackNavigatorProps<WalletSyncNavigatorStackParamList, ScreenName.WalletSyncSuccess>
>;

const FollowInstructionsDrawer = ({ isOpen, handleClose }: Props) => {
  const navigation = useNavigation<NavigationProps["navigation"]>();

  const goNext = useCallback(() => {
    handleClose();
    navigation.navigate(NavigatorName.WalletSync, {
      screen: ScreenName.WalletSyncSuccess,
      params: { created: true },
    });
  }, [handleClose, navigation]);

  useEffect(() => {
    // TODO : Update when Trustchain integration
    if (isOpen) {
      setTimeout(() => goNext(), 3000);
    }
  }, [goNext, isOpen]);

  return (
    <>
      <TrackScreen />
      <QueuedDrawer isRequestingToBeOpened={isOpen} onClose={handleClose}>
        <FollowInstructions />
      </QueuedDrawer>
    </>
  );
};

export default FollowInstructionsDrawer;
