import React, { useCallback, useContext, useState } from "react";
import Button from "~/components/Button";
import QueuedDrawer from ".";
import { Flex, Tag, Text } from "@ledgerhq/native-ui";
import ModalLock from "~/components/ModalLock";
import { useDispatch, useSelector } from "react-redux";
import { setDebugAppLevelDrawerOpened } from "~/actions/settings";
import { debugAppLevelDrawerOpenedSelector } from "~/reducers/settings";
import { useNavigation } from "@react-navigation/core";
import { SettingsNavigatorStackParamList } from "~/components/RootNavigator/types/SettingsNavigator";
import { ScreenName } from "~/const";
import { StackNavigatorNavigation } from "~/components/RootNavigator/types/helpers";
import { QueuedDrawersContext } from "./QueuedDrawersContext";

export const MainTestScreen = () => {
  const { _clearQueueDIRTYDONOTUSE, closeAllDrawers } = useContext(QueuedDrawersContext);
  const [drawer1RequestingToBeOpened, setDrawer1RequestingToBeOpened] = useState(false);
  const [drawer2RequestingToBeOpened, setDrawer2RequestingToBeOpened] = useState(false);
  const [drawer3RequestingToBeOpened, setDrawer3RequestingToBeOpened] = useState(false);
  const [drawer4ForcingToBeOpened, setDrawer4ForcingToBeOpened] = useState(false);

  const handleDrawer1Close = useCallback(() => setDrawer1RequestingToBeOpened(false), []);
  const handleDrawer2Close = useCallback(() => setDrawer2RequestingToBeOpened(false), []);
  const handleDrawer3Close = useCallback(() => setDrawer3RequestingToBeOpened(false), []);
  const handleDrawer4Close = useCallback(() => setDrawer4ForcingToBeOpened(false), []);

  const [areDrawersLocked, setAreDrawersLocked] = useState(false);

  const isDebugAppLevelDrawerOpened = useSelector(debugAppLevelDrawerOpenedSelector);
  const dispatch = useDispatch();
  const handleDebugAppLevelDrawerOpenedChange = useCallback(
    (val: boolean) => {
      dispatch(setDebugAppLevelDrawerOpened(val));
    },
    [dispatch],
  );

  const navigation = useNavigation<StackNavigatorNavigation<SettingsNavigatorStackParamList>>();
  const navigateToTestScreenWithDrawerRequestingToBeOpened = useCallback(() => {
    navigation.navigate(ScreenName.DebugQueuedDrawerScreen1);
  }, [navigation]);
  const navigationToTestScreenWithDrawerForcingToBeOpened = useCallback(() => {
    navigation.navigate(ScreenName.DebugQueuedDrawerScreen2);
  }, [navigation]);

  const buttons = (
    <Flex flexDirection={"column"} rowGap={4}>
      <Button type="main" title={"_clearQueueDIRTYDONOTUSE"} onPress={_clearQueueDIRTYDONOTUSE} />
      <Button type="main" title={"closeAllDrawers"} onPress={closeAllDrawers} />
      <Button
        testID="drawer1-button"
        type="main"
        title={
          drawer1RequestingToBeOpened ? "Cancel Request Open Drawer 1" : "Request Open Drawer 1"
        }
        onPress={() => setDrawer1RequestingToBeOpened(state => !state)}
      />
      <Button
        testID="drawer2-button"
        type="main"
        title={
          drawer2RequestingToBeOpened ? "Cancel Request Open Drawer 2" : "Request Open Drawer 2"
        }
        onPress={() => setDrawer2RequestingToBeOpened(state => !state)}
      />
      <Button
        testID="drawer3-button"
        type="main"
        title={
          drawer3RequestingToBeOpened ? "Cancel Request Open Drawer 3" : "Request Open Drawer 3"
        }
        onPress={() => setDrawer3RequestingToBeOpened(state => !state)}
      />
      <Button
        testID="drawer4-button"
        type="main"
        title={drawer4ForcingToBeOpened ? "Cancel Force Open Drawer 4" : "Force Open Drawer 4"}
        onPress={() => setDrawer4ForcingToBeOpened(state => !state)}
      />
      <Button
        testID="lock-drawers-button"
        type="main"
        title={areDrawersLocked ? "Unlock Drawers" : "Lock Drawers"}
        onPress={() => setAreDrawersLocked(!areDrawersLocked)}
      />
      <Button
        testID="debug-app-level-drawer-button"
        type="main"
        title={
          isDebugAppLevelDrawerOpened
            ? "Close Debug App Level Drawer"
            : "Open Debug App Level Drawer"
        }
        onPress={() => handleDebugAppLevelDrawerOpenedChange(!isDebugAppLevelDrawerOpened)}
      />
      <Button
        testID="navigate-to-test-screen-with-drawer-requesting-to-be-opened-button"
        type="main"
        title="Navigate to Test Screen with Drawer Requesting to be Opened"
        onPress={navigateToTestScreenWithDrawerRequestingToBeOpened}
      />
      <Button
        testID="navigate-to-test-screen-with-drawer-forcing-to-be-opened-button"
        type="main"
        title="Navigate to Test Screen with Drawer Forcing to be Opened"
        onPress={navigationToTestScreenWithDrawerForcingToBeOpened}
      />
    </Flex>
  );

  return (
    <Flex flexDirection={"column"} rowGap={4} px={6}>
      <Flex flexDirection={"row"} columnGap={3} alignItems={"center"} my={5}>
        <Text variant="tiny">{`Drawers requesting/forcing to be opened: `}</Text>
        {[
          drawer1RequestingToBeOpened,
          drawer2RequestingToBeOpened,
          drawer3RequestingToBeOpened,
          drawer4ForcingToBeOpened,
        ].map((drawerState, index) => (
          <Tag
            key={index}
            size="medium"
            backgroundColor={drawerState ? "success.c70" : "error.c70"}
          >
            {index + 1}
          </Tag>
        ))}
      </Flex>
      {buttons}
      <QueuedDrawer
        isRequestingToBeOpened={drawer1RequestingToBeOpened}
        onClose={handleDrawer1Close}
        title="Drawer 1"
      >
        {buttons}
      </QueuedDrawer>
      <QueuedDrawer
        isRequestingToBeOpened={drawer2RequestingToBeOpened}
        onClose={handleDrawer2Close}
        title="Drawer 2"
      >
        {buttons}
      </QueuedDrawer>
      <QueuedDrawer
        isRequestingToBeOpened={drawer3RequestingToBeOpened}
        onClose={handleDrawer3Close}
        title="Drawer 3"
      >
        {buttons}
      </QueuedDrawer>
      <QueuedDrawer
        isForcingToBeOpened={drawer4ForcingToBeOpened}
        onClose={handleDrawer4Close}
        title="Drawer 4"
      >
        {buttons}
      </QueuedDrawer>
      {areDrawersLocked && <ModalLock />}
    </Flex>
  );
};

export const TestScreenWithDrawerRequestingToBeOpened = () => {
  const [drawerRequestingToBeOpened, setDrawerRequestingToBeOpened] = useState(true);

  const handleDrawerClose = useCallback(() => setDrawerRequestingToBeOpened(false), []);

  const buttons = (
    <Flex flexDirection={"column"} rowGap={4}>
      <Button
        type="main"
        title={drawerRequestingToBeOpened ? "Cancel Request Open Drawer" : "Request Open Drawer"}
        onPress={() => setDrawerRequestingToBeOpened(state => !state)}
      />
    </Flex>
  );

  return (
    <Flex flexDirection={"column"} rowGap={4} px={6}>
      {buttons}
      <QueuedDrawer
        isRequestingToBeOpened={drawerRequestingToBeOpened}
        onClose={handleDrawerClose}
        title="Drawer"
      >
        {buttons}
      </QueuedDrawer>
    </Flex>
  );
};

export const TestScreenWithDrawerForcingToBeOpened = () => {
  const [drawerForcingToBeOpened, setDrawerForcingToBeOpened] = useState(true);

  const handleDrawerClose = useCallback(() => setDrawerForcingToBeOpened(false), []);

  const buttons = (
    <Flex flexDirection={"column"} rowGap={4}>
      <Button
        type="main"
        title={drawerForcingToBeOpened ? "Cancel Force Open Drawer" : "Force Open Drawer"}
        onPress={() => setDrawerForcingToBeOpened(state => !state)}
      />
    </Flex>
  );

  return (
    <Flex flexDirection={"column"} rowGap={4} px={6}>
      {buttons}
      <QueuedDrawer
        isForcingToBeOpened={drawerForcingToBeOpened}
        onClose={handleDrawerClose}
        title="Drawer"
      >
        {buttons}
      </QueuedDrawer>
    </Flex>
  );
};
