import React, { Dispatch, SetStateAction, useCallback, useState } from "react";
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
import { useQueuedDrawerContext } from "./QueuedDrawersContext";

export enum TestIdPrefix {
  Main = "main",
  InDrawer1 = "in-drawer1",
  InDrawer2 = "in-drawer2",
  InDrawer3 = "in-drawer3",
  InDrawer4 = "in-drawer4",
}

export function testIds(testIdPrefix: TestIdPrefix) {
  return {
    closeAllDrawersButton: `${testIdPrefix}_close-all-drawers-button`,
    drawer1Button: `${testIdPrefix}_drawer1-button`,
    drawer2Button: `${testIdPrefix}_drawer2-button`,
    drawer3Button: `${testIdPrefix}_drawer3-button`,
    drawer4ForcingButton: `${testIdPrefix}_drawer4-button`,
    lockDrawersButton: `${testIdPrefix}_lock-drawers-button`,
    debugAppLevelDrawerButton: `${testIdPrefix}_debug-app-level-drawer-button`,
    navigateToEmptyTestScreenButton: `${testIdPrefix}_navigate-to-empty-test-screen-button`,
    navigateToTestScreenWithDrawerRequestingToBeOpenedButton: `${testIdPrefix}_navigate-to-test-screen-with-drawer-requesting-to-be-opened-button`,
    navigateToTestScreenWithDrawerForcingToBeOpenedButton: `${testIdPrefix}_navigate-to-test-screen-with-drawer-forcing-to-be-opened-button`,
  };
}

type ButtonsProps = {
  testIdPrefix: TestIdPrefix;
  drawer1RequestingToBeOpened: boolean;
  drawer2RequestingToBeOpened: boolean;
  drawer3RequestingToBeOpened: boolean;
  drawer4ForcingToBeOpened: boolean;
  areDrawersLocked: boolean;
  setDrawer1RequestingToBeOpened: Dispatch<SetStateAction<boolean>>;
  setDrawer2RequestingToBeOpened: Dispatch<SetStateAction<boolean>>;
  setDrawer3RequestingToBeOpened: Dispatch<SetStateAction<boolean>>;
  setDrawer4ForcingToBeOpened: Dispatch<SetStateAction<boolean>>;
  setAreDrawersLocked: Dispatch<SetStateAction<boolean>>;
};

const Buttons: React.FC<ButtonsProps> = React.memo(props => {
  const { _clearQueueDIRTYDONOTUSE, closeAllDrawers } = useQueuedDrawerContext();

  // navigation
  const navigation = useNavigation<StackNavigatorNavigation<SettingsNavigatorStackParamList>>();
  const navigateToEmptyTestScreen = useCallback(() => {
    navigation.navigate(ScreenName.DebugQueuedDrawerScreen0);
  }, [navigation]);
  const navigateToTestScreenWithDrawerRequestingToBeOpened = useCallback(() => {
    navigation.navigate(ScreenName.DebugQueuedDrawerScreen1);
  }, [navigation]);
  const navigationToTestScreenWithDrawerForcingToBeOpened = useCallback(() => {
    navigation.navigate(ScreenName.DebugQueuedDrawerScreen2);
  }, [navigation]);

  // app level drawer
  const isDebugAppLevelDrawerOpened = useSelector(debugAppLevelDrawerOpenedSelector);
  const dispatch = useDispatch();
  const handleDebugAppLevelDrawerOpenedChange = useCallback(
    (val: boolean) => {
      dispatch(setDebugAppLevelDrawerOpened(val));
    },
    [dispatch],
  );
  return (
    <Flex flexDirection={"column"} rowGap={4}>
      <Button
        size="small"
        type="main"
        title={"_clearQueueDIRTYDONOTUSE"}
        onPress={_clearQueueDIRTYDONOTUSE}
      />
      <Button
        size="small"
        testID={testIds(props.testIdPrefix).closeAllDrawersButton}
        type="main"
        title={"closeAllDrawers"}
        onPress={closeAllDrawers}
      />
      <Button
        size="small"
        testID={testIds(props.testIdPrefix).drawer1Button}
        type="main"
        title={
          props.drawer1RequestingToBeOpened
            ? "Cancel Request Open Drawer 1"
            : "Request Open Drawer 1"
        }
        onPress={() => props.setDrawer1RequestingToBeOpened(state => !state)}
      />
      <Button
        size="small"
        testID={testIds(props.testIdPrefix).drawer2Button}
        type="main"
        title={
          props.drawer2RequestingToBeOpened
            ? "Cancel Request Open Drawer 2"
            : "Request Open Drawer 2"
        }
        onPress={() => props.setDrawer2RequestingToBeOpened(state => !state)}
      />
      <Button
        size="small"
        testID={testIds(props.testIdPrefix).drawer3Button}
        type="main"
        title={
          props.drawer3RequestingToBeOpened
            ? "Cancel Request Open Drawer 3"
            : "Request Open Drawer 3"
        }
        onPress={() => props.setDrawer3RequestingToBeOpened(state => !state)}
      />
      <Button
        size="small"
        testID={testIds(props.testIdPrefix).drawer4ForcingButton}
        type="main"
        title={
          props.drawer4ForcingToBeOpened ? "Cancel Force Open Drawer 4" : "Force Open Drawer 4"
        }
        onPress={() => props.setDrawer4ForcingToBeOpened(state => !state)}
      />
      <Button
        size="small"
        testID={testIds(props.testIdPrefix).lockDrawersButton}
        type="main"
        title={props.areDrawersLocked ? "Unlock Drawers" : "Lock Drawers"}
        onPress={() => props.setAreDrawersLocked(!props.areDrawersLocked)}
      />
      <Button
        size="small"
        testID={testIds(props.testIdPrefix).debugAppLevelDrawerButton}
        type="main"
        title={
          isDebugAppLevelDrawerOpened
            ? "Close Debug App Level Drawer"
            : "Open Debug App Level Drawer"
        }
        onPress={() => handleDebugAppLevelDrawerOpenedChange(!isDebugAppLevelDrawerOpened)}
      />
      <Button
        size="small"
        testID={testIds(props.testIdPrefix).navigateToEmptyTestScreenButton}
        type="main"
        title="Navigate to Empty Test Screen"
        onPress={navigateToEmptyTestScreen}
      />
      <Button
        size="small"
        testID={
          testIds(props.testIdPrefix).navigateToTestScreenWithDrawerRequestingToBeOpenedButton
        }
        type="main"
        title="Navigate to Test Screen with Drawer Requesting to be Opened"
        onPress={navigateToTestScreenWithDrawerRequestingToBeOpened}
      />
      <Button
        size="small"
        testID={testIds(props.testIdPrefix).navigateToTestScreenWithDrawerForcingToBeOpenedButton}
        type="main"
        title="Navigate to Test Screen with Drawer Forcing to be Opened"
        onPress={navigationToTestScreenWithDrawerForcingToBeOpened}
      />
    </Flex>
  );
});

export const MainTestScreen = () => {
  const [drawer1RequestingToBeOpened, setDrawer1RequestingToBeOpened] = useState(false);
  const [drawer2RequestingToBeOpened, setDrawer2RequestingToBeOpened] = useState(false);
  const [drawer3RequestingToBeOpened, setDrawer3RequestingToBeOpened] = useState(false);
  const [drawer4ForcingToBeOpened, setDrawer4ForcingToBeOpened] = useState(false);

  const handleDrawer1Close = () => setDrawer1RequestingToBeOpened(false); // purposely not using useCallback to check if drawer behaves well when onClose prop changes
  const handleDrawer2Close = useCallback(() => setDrawer2RequestingToBeOpened(false), []);
  const handleDrawer3Close = useCallback(() => setDrawer3RequestingToBeOpened(false), []);
  const handleDrawer4Close = useCallback(() => setDrawer4ForcingToBeOpened(false), []);

  const [areDrawersLocked, setAreDrawersLocked] = useState(false);

  const mainButtonsProps: Omit<ButtonsProps, "testIdPrefix"> = {
    drawer1RequestingToBeOpened,
    drawer2RequestingToBeOpened,
    drawer3RequestingToBeOpened,
    drawer4ForcingToBeOpened,
    areDrawersLocked,
    setDrawer1RequestingToBeOpened,
    setDrawer2RequestingToBeOpened,
    setDrawer3RequestingToBeOpened,
    setDrawer4ForcingToBeOpened,
    setAreDrawersLocked,
  };

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
      <Buttons {...mainButtonsProps} testIdPrefix={TestIdPrefix.Main} />
      <QueuedDrawer
        isRequestingToBeOpened={drawer1RequestingToBeOpened}
        onClose={handleDrawer1Close}
        title="Drawer 1"
      >
        <Buttons {...mainButtonsProps} testIdPrefix={TestIdPrefix.InDrawer1} />
      </QueuedDrawer>
      <QueuedDrawer
        isRequestingToBeOpened={drawer2RequestingToBeOpened}
        onClose={handleDrawer2Close}
        title="Drawer 2"
      >
        <Buttons {...mainButtonsProps} testIdPrefix={TestIdPrefix.InDrawer2} />
      </QueuedDrawer>
      <QueuedDrawer
        isRequestingToBeOpened={drawer3RequestingToBeOpened}
        onClose={handleDrawer3Close}
        title="Drawer 3"
      >
        <Buttons {...mainButtonsProps} testIdPrefix={TestIdPrefix.InDrawer3} />
      </QueuedDrawer>
      <QueuedDrawer
        isForcingToBeOpened={drawer4ForcingToBeOpened}
        onClose={handleDrawer4Close}
        title="Drawer 4"
      >
        <Buttons {...mainButtonsProps} testIdPrefix={TestIdPrefix.InDrawer4} />
      </QueuedDrawer>
      {areDrawersLocked && <ModalLock />}
    </Flex>
  );
};

const NavigateBackButton = () => {
  const navigate = useNavigation();
  return (
    <Button
      size="small"
      type="main"
      title="Navigate Back"
      onPress={navigate.goBack}
      testID="navigate-back-button"
    />
  );
};

export const EmptyScreen = () => {
  return (
    <Flex>
      <NavigateBackButton />
    </Flex>
  );
};

export const TestScreenWithDrawerRequestingToBeOpened = () => {
  const [drawerRequestingToBeOpened, setDrawerRequestingToBeOpened] = useState(true);

  const handleDrawerClose = useCallback(() => setDrawerRequestingToBeOpened(false), []);

  const buttons = (
    <Flex flexDirection={"column"} rowGap={4}>
      <Button
        size="small"
        type="main"
        title={drawerRequestingToBeOpened ? "Cancel Request Open Drawer" : "Request Open Drawer"}
        onPress={() => setDrawerRequestingToBeOpened(state => !state)}
      />
    </Flex>
  );

  return (
    <Flex flexDirection={"column"} rowGap={4} px={6}>
      {buttons}
      <NavigateBackButton />
      <QueuedDrawer
        isRequestingToBeOpened={drawerRequestingToBeOpened}
        onClose={handleDrawerClose}
        title="Drawer on screen 1"
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
        size="small"
        type="main"
        title={drawerForcingToBeOpened ? "Cancel Force Open Drawer" : "Force Open Drawer"}
        onPress={() => setDrawerForcingToBeOpened(state => !state)}
      />
    </Flex>
  );

  return (
    <Flex flexDirection={"column"} rowGap={4} px={6}>
      {buttons}
      <NavigateBackButton />
      <QueuedDrawer
        isForcingToBeOpened={drawerForcingToBeOpened}
        onClose={handleDrawerClose}
        title="Drawer on screen 2"
      >
        {buttons}
      </QueuedDrawer>
    </Flex>
  );
};
