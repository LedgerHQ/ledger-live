import React, { useState } from "react";
import QueuedDrawer from "LLM/components/QueuedDrawer";
import { TrackScreen } from "~/analytics";

import GenericErrorView from "~/components/GenericErrorView";
import { Flex, InfiniteLoader } from "@ledgerhq/native-ui";

import { ListInstances } from "../../components/ManageInstances/ListInstances";
import { useGetMembers } from "../../hooks/useGetMembers";
import { memberCredentialsSelector } from "@ledgerhq/trustchain/store";
import { useSelector } from "react-redux";
import { DeletionError, ErrorReason } from "../../components/ManageInstances/DeletionError";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
};

export enum Scene {
  List,
  Instructions,
  AutoRemove,
  Unsecured,
}

const ManageInstancesDrawer = ({ isOpen, handleClose }: Props) => {
  const { isError, error, isLoading, data } = useGetMembers();
  const memberCredentials = useSelector(memberCredentialsSelector);

  //const navigation = useNavigation<StackNavigatorNavigation<WalletSyncNavigatorStackParamList>>();

  const [scene, setScene] = useState(Scene.List);

  const onClickDelete = (scene: Scene) => setScene(scene);

  const closeDrawer = () => {
    handleClose();
    setScene(Scene.List);
  };

  const getScene = () => {
    if (isError) {
      return <GenericErrorView error={error} withDescription withHelp hasExportLogButton />;
    }

    if (isLoading) {
      return (
        <Flex alignItems="center" justifyContent="center" height={150}>
          <InfiniteLoader size={50} />
        </Flex>
      );
    }
    if (scene === Scene.List) {
      return (
        <ListInstances
          onClickDelete={onClickDelete}
          members={data}
          currentInstance={memberCredentials?.pubkey}
        />
      );
    }

    if (scene === Scene.AutoRemove) {
      return (
        <DeletionError
          error={ErrorReason.AUTO_REMOVE}
          // eslint-disable-next-line no-console
          goToDelete={() => console.log("gotoDelete")}
          understood={() => setScene(Scene.List)}
        />
      );
    }
    if (scene === Scene.Instructions) {
      return null;
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

export default ManageInstancesDrawer;
