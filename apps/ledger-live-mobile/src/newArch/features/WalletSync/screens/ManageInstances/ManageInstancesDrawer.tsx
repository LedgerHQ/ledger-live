import React, { useState } from "react";
import QueuedDrawer from "LLM/components/QueuedDrawer";
import { TrackScreen } from "~/analytics";

import GenericErrorView from "~/components/GenericErrorView";
import { Flex, InfiniteLoader } from "@ledgerhq/native-ui";

import { ListInstances } from "../../components/ManageInstances/ListInstances";
import { useGetMembers } from "../../hooks/useGetMembers";
import { memberCredentialsSelector } from "@ledgerhq/trustchain/store";
import { useSelector } from "react-redux";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
};

enum Scene {
  List,
  Instructions,
}

const ManageInstancesDrawer = ({ isOpen, handleClose }: Props) => {
  const { isError, error, isLoading, data } = useGetMembers();
  const memberCredentials = useSelector(memberCredentialsSelector);

  //const navigation = useNavigation<StackNavigatorNavigation<WalletSyncNavigatorStackParamList>>();

  const [scene, setScene] = useState(Scene.List);

  const onClickDelete = () => setScene(Scene.Instructions);

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
