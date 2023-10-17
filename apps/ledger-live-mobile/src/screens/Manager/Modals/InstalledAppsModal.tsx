import React, { memo, useCallback, useMemo, useEffect } from "react";

import { Text, Flex, Button, BaseModal } from "@ledgerhq/native-ui";
import { FlatList } from "react-native";
import { App, DeviceInfo } from "@ledgerhq/types-live";
import { State, Action } from "@ledgerhq/live-common/apps/index";
import { Trans } from "react-i18next";
import AppIcon from "../AppsList/AppIcon";
import ByteSize from "../../../components/ByteSize";
import AppUninstallButton from "../AppsList/AppUninstallButton";
import AppProgressButton from "../AppsList/AppProgressButton";

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
  setAppUninstallWithDependencies: (_: { dependents: App[]; app: App }) => void;
};

const UninstallButton = ({
  app,
  state,
  dispatch,
  setAppUninstallWithDependencies,
}: UninstallButtonProps) => {
  const { uninstallQueue } = state;
  const uninstalling = useMemo(() => uninstallQueue.includes(app.name), [uninstallQueue, app.name]);
  const renderAppState = () => {
    switch (true) {
      case uninstalling:
        return <AppProgressButton state={state} name={app.name} size={34} />;
      default:
        return (
          <AppUninstallButton
            app={app}
            state={state}
            dispatch={dispatch}
            setAppUninstallWithDependencies={setAppUninstallWithDependencies}
            size={34}
          />
        );
    }
  };

  return <Flex>{renderAppState()}</Flex>;
};

type RowProps = {
  app: App;
  state: State;
  dispatch: (_: Action) => void;
  setAppUninstallWithDependencies: (_: { dependents: App[]; app: App }) => void;
  deviceInfo: DeviceInfo;
};

const Row = ({ app, state, dispatch, setAppUninstallWithDependencies, deviceInfo }: RowProps) => (
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
      <UninstallButton
        app={app}
        state={state}
        dispatch={dispatch}
        setAppUninstallWithDependencies={setAppUninstallWithDependencies}
      />
    </Flex>
  </Flex>
);

const modalStyleOverrides = {
  modal: {
    flex: 1,
    justifyContent: "flex-end" as const,
    margin: 0,
  },
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  state: State;
  dispatch: (_: Action) => void;
  appList?: App[];
  setAppUninstallWithDependencies: (_: { dependents: App[]; app: App }) => void;
  illustration: JSX.Element;
  deviceInfo: DeviceInfo;
};

const InstalledAppsModal = ({
  isOpen,
  onClose,
  state,
  dispatch,
  appList,
  setAppUninstallWithDependencies,
  illustration,
  deviceInfo,
}: Props) => {
  const onUninstallAll = useCallback(() => dispatch({ type: "wipe" }), [dispatch]);

  const renderItem = useCallback(
    ({ item }: { item: App }) => (
      <Row
        app={item}
        state={state}
        dispatch={dispatch}
        setAppUninstallWithDependencies={setAppUninstallWithDependencies}
        deviceInfo={deviceInfo}
      />
    ),
    [deviceInfo, dispatch, setAppUninstallWithDependencies, state],
  );

  useEffect(() => {
    if (!appList || !appList.length) onClose();
  }, [appList, onClose]);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      modalStyle={modalStyleOverrides.modal}
      containerStyle={{ height: "100%" }}
      propagateSwipe={true}
    >
      <Flex flex={1}>
        <FlatList
          data={appList}
          renderItem={renderItem}
          keyExtractor={item => "" + item.id}
          ListHeaderComponent={<Header illustration={illustration} />}
          showsVerticalScrollIndicator={false}
        />
      </Flex>
      <Button mt={6} mb={6} size="large" type="error" onPress={onUninstallAll}>
        <Trans i18nKey={"manager.uninstall.uninstallAll"} />
      </Button>
    </BaseModal>
  );
};

export default memo(InstalledAppsModal);
