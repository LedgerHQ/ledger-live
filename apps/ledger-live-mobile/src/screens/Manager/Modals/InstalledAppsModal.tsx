import React, { memo, useCallback, useMemo, useEffect } from "react";

import { Text, Flex, Button } from "@ledgerhq/native-ui";
import { FlatList } from "react-native";
import { App, DeviceInfo } from "@ledgerhq/types-live";
import { State, Action } from "@ledgerhq/live-common/apps/index";
import { Trans } from "react-i18next";
import AppIcon from "../AppsList/AppIcon";
import ByteSize from "~/components/ByteSize";
import AppUninstallButton from "../AppsList/AppUninstallButton";
import AppProgressButton from "../AppsList/AppProgressButton";
import QueuedDrawer from "~/components/QueuedDrawer";

type HeaderProps = {
  illustration: JSX.Element;
};

const Header = ({ illustration }: HeaderProps) => (
  <Flex alignItems="center">
    {illustration}
    <Text variant="h2" fontWeight="medium" color="neutral.c100" my={6}>
      <Trans i18nKey={"manager.myApps"} />
    </Text>
  </Flex>
);

type UninstallButtonProps = {
  app: App;
  state: State;
  dispatch: (_: Action) => void;
};

const UninstallButton = ({ app, state, dispatch }: UninstallButtonProps) => {
  const { uninstallQueue } = state;
  const uninstalling = useMemo(() => uninstallQueue.includes(app.name), [uninstallQueue, app.name]);
  const renderAppState = () => {
    switch (true) {
      case uninstalling:
        return <AppProgressButton state={state} name={app.name} size={34} />;
      default:
        return <AppUninstallButton app={app} state={state} dispatch={dispatch} size={34} />;
    }
  };

  return <Flex>{renderAppState()}</Flex>;
};

type RowProps = {
  app: App;
  state: State;
  dispatch: (_: Action) => void;
  deviceInfo: DeviceInfo;
};

const Row = ({ app, state, dispatch, deviceInfo }: RowProps) => (
  <Flex flexDirection="row" py={4} alignItems="center" justifyContent="space-between">
    <Flex flexDirection="row" alignItems="center">
      <AppIcon app={app} size={24} radius={8} />
      <Text variant="large" fontWeight="semiBold" color="neutral.c100" ml={4}>
        {app.name}
      </Text>
    </Flex>
    <Flex flexDirection="row" alignItems="center">
      <Text variant="small" fontWeight="medium" color="neutral.c80" mx={4}>
        <ByteSize
          value={app.bytes}
          deviceModel={state.deviceModel}
          firmwareVersion={deviceInfo.version}
        />
      </Text>
      <UninstallButton app={app} state={state} dispatch={dispatch} />
    </Flex>
  </Flex>
);

type Props = {
  isOpen: boolean;
  onClose: () => void;
  state: State;
  dispatch: (_: Action) => void;
  appList?: App[];
  illustration: JSX.Element;
  deviceInfo: DeviceInfo;
};

const InstalledAppsModal = ({
  isOpen,
  onClose,
  state,
  dispatch,
  appList,
  illustration,
  deviceInfo,
}: Props) => {
  const onUninstallAll = useCallback(() => dispatch({ type: "wipe" }), [dispatch]);

  const renderItem = useCallback(
    ({ item }: { item: App }) => (
      <Row app={item} state={state} dispatch={dispatch} deviceInfo={deviceInfo} />
    ),
    [deviceInfo, dispatch, state],
  );

  useEffect(() => {
    if (!appList || !appList.length) onClose();
  }, [appList, onClose]);

  return (
    <QueuedDrawer isRequestingToBeOpened={isOpen} onClose={onClose} propagateSwipe={true}>
      <Header illustration={illustration} />
      <FlatList
        data={appList}
        renderItem={renderItem}
        keyExtractor={item => "" + item.id}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
      />
      <Button mt={6} size="large" type="error" onPress={onUninstallAll}>
        <Trans i18nKey={"manager.uninstall.uninstallAll"} />
      </Button>
    </QueuedDrawer>
  );
};

export default memo(InstalledAppsModal);
