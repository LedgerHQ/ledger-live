import React, { useState } from "react";
import QueuedDrawer from "LLM/components/QueuedDrawer";
import { TrackScreen } from "~/analytics";

import GenericErrorView from "~/components/GenericErrorView";
import { Flex, InfiniteLoader } from "@ledgerhq/native-ui";
import { useDestroyTrustchain } from "../../hooks/useDestroyTrustchain";

import { useNavigation } from "@react-navigation/native";
import { StackNavigatorNavigation } from "~/components/RootNavigator/types/helpers";
import { WalletSyncNavigatorStackParamList } from "~/components/RootNavigator/types/WalletSyncNavigator";
import { ScreenName } from "~/const";
import { ManageKey } from "../../components/ManageKey/ManageKey";
import { ConfirmManageKey } from "../../components/ManageKey/Confirm";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
};

enum Scene {
  Manage,
  Confirm,
}

const ManageKeyDrawer = ({ isOpen, handleClose }: Props) => {
  const { deleteMutation } = useDestroyTrustchain();
  const isLoading = deleteMutation.isPending;

  const navigation = useNavigation<StackNavigatorNavigation<WalletSyncNavigatorStackParamList>>();

  const [scene, setScene] = useState(Scene.Manage);

  const onClickDelete = () => setScene(Scene.Confirm);

  const closeDrawer = () => {
    handleClose();
    setScene(Scene.Manage);
  };

  const onClickConfirm = async () => {
    await deleteMutation.mutateAsync();
    closeDrawer();
    navigation.navigate(ScreenName.WalletSyncManageKeyDeleteSuccess);
  };

  const getScene = () => {
    if (deleteMutation.error) {
      return (
        <GenericErrorView
          error={deleteMutation.error}
          withDescription
          withHelp
          hasExportLogButton
        />
      );
    }

    if (isLoading) {
      return (
        <Flex alignItems="center" justifyContent="center" height={150}>
          <InfiniteLoader size={50} />
        </Flex>
      );
    }
    if (scene === Scene.Manage) {
      return <ManageKey onClickDelete={onClickDelete} />;
    }
    if (scene === Scene.Confirm) {
      return <ConfirmManageKey onClickConfirm={onClickConfirm} onCancel={closeDrawer} />;
    }
  };

  return (
    <>
      <TrackScreen />
      <QueuedDrawer isRequestingToBeOpened={isOpen} onClose={closeDrawer}>
        {getScene()}
      </QueuedDrawer>
    </>
  );
};

export default ManageKeyDrawer;
