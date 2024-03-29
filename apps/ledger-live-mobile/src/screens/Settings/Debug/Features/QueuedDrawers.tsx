import React, { useCallback, useContext, useEffect, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { Flex, Alert, Switch, Button, Text } from "@ledgerhq/native-ui";
import { useDispatch, useSelector } from "react-redux";
import QueuedDrawer from "~/components/QueuedDrawer";
import { StackNavigatorNavigation } from "~/components/RootNavigator/types/helpers";
import { SettingsNavigatorStackParamList } from "~/components/RootNavigator/types/SettingsNavigator";
import { ScreenName } from "~/const";
import { setDebugAppLevelDrawerOpened } from "~/actions/settings";
import { debugAppLevelDrawerOpenedSelector } from "~/reducers/settings";
import LockModal from "~/components/ModalLock";
import NavigationScrollView from "~/components/NavigationScrollView";
import { QueuedDrawersContext } from "~/components/QueuedDrawer/QueuedDrawersContext";

/**
 * Debugging screen to test:
 * - opening/closing 1 drawer
 * - opening/closing successive drawers
 * - opening/closing drawers after navigating and coming back
 * - opening/closing a drawer that requests to be opened after x seconds
 * - opening/closing a drawer that forces other drawers to close after x seconds
 * - opening/closing a drawer located at the App level (like the notification or ratings drawers)
 *
 * Also possible to navigate to another screen directly or after x seconds to test how the queued drawer system handles it.
 */
export default function DebugQueuedDrawers() {
  const navigation = useNavigation<StackNavigatorNavigation<SettingsNavigatorStackParamList>>();

  const { _clearQueue } = useContext(QueuedDrawersContext);

  const [isDrawer1Open, setIsDrawer1Open] = useState(false);
  const [isDrawer2Open, setIsDrawer2Open] = useState(false);
  const [isDrawer3Open, setIsDrawer3Open] = useState(false);

  const [isDrawer4Started, setIsDrawer4Started] = useState(false);
  const [isDrawer4Open, setIsDrawer4Open] = useState(false);

  const [isDrawer5Started, setIsDrawer5Started] = useState(false);
  const [isDrawer5ForcingToBeOpened, setDrawer5IsForcingToBeOpened] = useState(false);

  const [isNavigatingAfter3s, setIsNavigatingAfter3s] = useState(false);

  const [isDrawer6AOpen, setIsDrawer6AOpen] = useState(false);
  const [isDrawer6BOpen, setIsDrawer6BOpen] = useState(false);

  const [areDrawersLockedStarted, setAreDrawersLockedStarted] = useState(false);
  const [areDrawersLocked, setAreDrawersLocked] = useState(false);

  // Handles 4th drawer opening after x seconds
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;

    // Adds the 4th drawer to the queue after 3 seconds
    if (isDrawer4Started) {
      timeoutId = setTimeout(() => {
        setIsDrawer4Open(true);
        setIsDrawer4Started(false);
      }, 3000);
    }

    // Not cleaning on navigation-lost-focus to test what happens when navigating
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isDrawer4Started]);

  // Handles 5th drawer opening after x seconds
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;

    // Forces the 5th drawer to be opened after 3 seconds
    if (isDrawer5Started) {
      timeoutId = setTimeout(() => {
        setDrawer5IsForcingToBeOpened(true);
        setIsDrawer5Started(false);
      }, 3000);
    }

    // Not cleaning on navigation-lost-focus to test what happens when navigating
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isDrawer5Started]);

  // Handles navigation after x seconds
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;

    if (isNavigatingAfter3s) {
      timeoutId = setTimeout(() => {
        setIsNavigatingAfter3s(false);
        navigation.navigate(ScreenName.DebugLottie);
      }, 3000);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isNavigatingAfter3s, navigation]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;

    if (areDrawersLockedStarted) {
      setAreDrawersLocked(true);

      timeoutId = setTimeout(() => {
        setAreDrawersLocked(false);
        setAreDrawersLockedStarted(false);
      }, 10000);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (areDrawersLockedStarted) {
        setAreDrawersLockedStarted(false);
        setAreDrawersLocked(false);
      }
    };
  }, [areDrawersLockedStarted]);

  const handleDrawer1Close = useCallback(() => {
    setIsDrawer1Open(false);
  }, []);

  const handleDrawer2Close = useCallback(() => {
    setIsDrawer2Open(false);
  }, []);

  const handleDrawer3Close = useCallback(() => {
    setIsDrawer3Open(false);
  }, []);

  const handleDrawer4Close = useCallback(() => {
    setIsDrawer4Open(false);
  }, []);

  const handleDrawer5Close = useCallback(() => {
    setDrawer5IsForcingToBeOpened(false);
  }, []);

  const handleDrawer6AClose = useCallback(() => {
    setIsDrawer6AOpen(false);
    setIsDrawer6BOpen(true);
  }, []);

  const handleDrawer6BClose = useCallback(() => {
    setIsDrawer6BOpen(false);
  }, []);

  const isDebugAppLevelDrawerOpened = useSelector(debugAppLevelDrawerOpenedSelector);

  const dispatch = useDispatch();
  const handleDebugAppLevelDrawerOpenedChange = useCallback(
    (val: boolean) => {
      dispatch(setDebugAppLevelDrawerOpened(val));
    },
    [dispatch],
  );

  const navigationButtons = (
    <>
      <Button
        type="main"
        outline
        onPress={() => navigation.navigate(ScreenName.DebugQueuedDrawerScreen1)}
      >
        Navigate to debug screen 1
      </Button>
      <Button
        type="main"
        outline
        onPress={() => navigation.navigate(ScreenName.DebugQueuedDrawerScreen2)}
      >
        Navigate to debug screen 2
      </Button>
    </>
  );

  return (
    <>
      <NavigationScrollView>
        <Flex p="4" rowGap={4}>
          <Button type="main" outline onPress={_clearQueue}>
            {"Clear queue (for debugging, if you have to, it means there's an issue)"}
          </Button>
          {navigationButtons}
          <Button
            type="main"
            outline
            onPress={() => {
              setIsDrawer1Open(true);
              setTimeout(() => {
                setIsDrawer1Open(false);
              }, 2000);
            }}
          >
            Open the first drawer and close it after 2sec
          </Button>
          <Button
            type="main"
            outline
            onPress={() => {
              setIsDrawer1Open(true);
              setIsDrawer2Open(true);
              setTimeout(() => {
                setIsDrawer1Open(false);
              }, 2000);
            }}
          >
            Open the two first drawers and close the first after 2sec
          </Button>
          <Button
            type="main"
            outline
            onPress={() => {
              setIsDrawer1Open(true);
              setIsDrawer2Open(true);
              setTimeout(() => {
                setIsDrawer2Open(false);
              }, 2000);
            }}
          >
            Open the two first drawers and close the second after 2sec
          </Button>
          <Flex>
            <Switch
              checked={isDrawer1Open}
              onChange={val => setIsDrawer1Open(val)}
              label={"Open the 1st drawer"}
            />
          </Flex>
          <Flex>
            <Switch
              checked={isDrawer2Open}
              onChange={val => {
                setIsDrawer1Open(val);
                setIsDrawer2Open(val);
              }}
              label={"Open the 1st then 2nd drawers"}
            />
          </Flex>
          <Flex>
            <Switch
              checked={isDrawer3Open}
              onChange={val => {
                setIsDrawer1Open(val);
                setIsDrawer2Open(val);
                setIsDrawer3Open(val);
              }}
              label={"Open the 1st then 2nd then 3rd drawers"}
            />
          </Flex>
          <Flex>
            <Switch
              checked={isDrawer4Started}
              onChange={val => {
                setIsDrawer4Started(val);
              }}
              label={
                "Open a 4th drawer after 3sec that adds itself to the queue of drawers, without forcing 🧑‍🎓"
              }
            />
          </Flex>
          <Flex>
            <Switch
              checked={isDrawer5Started}
              onChange={val => {
                setIsDrawer5Started(val);
              }}
              label={
                "Open a 5th drawer after 3sec that forces all the other opened drawers to close ⚔️"
              }
            />
          </Flex>
          <Flex>
            <Switch
              checked={isDebugAppLevelDrawerOpened}
              onChange={handleDebugAppLevelDrawerOpenedChange}
              label={"Open a drawer equivalent to the notification or ratings drawer 📲"}
            />
          </Flex>
          <Flex>
            <Switch
              checked={isDrawer6AOpen || isDrawer6BOpen}
              onChange={val => {
                // Only opens the 1st drawer, the 2nd one will be opened on user close
                setIsDrawer6AOpen(val);
              }}
              label={
                "Open a 1st drawer, and on user close, open a 2nd drawer after closing the 1st one. To test on iOS"
              }
            />
          </Flex>
          <Flex>
            <Switch
              checked={areDrawersLockedStarted}
              onChange={val => {
                setAreDrawersLockedStarted(val);
              }}
              label={`Lock all drawer for 10sec, then unlock them: currently ${
                areDrawersLocked ? "locked 🔒" : "unlocked 🔓"
              }`}
            />
          </Flex>
          <Alert type="info" title="Hey 🧙‍♀️ Test successive opening/closing of drawers !" />
          <Flex mt="8">
            <Text>
              Also, try navigating to a new screen by clicking on one of the buttons below and come
              back here with the back arrow. To check if the drawers are still working.
            </Text>

            <Button
              type="main"
              onPress={() => navigation.navigate(ScreenName.DebugLottie)}
              mt="8"
              size="small"
              outline
            >
              Navigate somewhere 🧞‍♂️
            </Button>
            <Button
              type="main"
              onPress={() => setIsNavigatingAfter3s(true)}
              mt="8"
              size="small"
              outline
            >
              Navigate somewhere after 3s ⏳
            </Button>
          </Flex>
        </Flex>
      </NavigationScrollView>
      <QueuedDrawer
        isRequestingToBeOpened={isDrawer1Open}
        onClose={handleDrawer1Close}
        preventBackdropClick
      >
        <Flex p="4">
          <Alert type="info" title="1st drawer" />
          {navigationButtons}
        </Flex>
      </QueuedDrawer>

      <QueuedDrawer
        isRequestingToBeOpened={isDrawer2Open}
        onClose={handleDrawer2Close}
        preventBackdropClick
      >
        <Flex p="4">
          <Alert type="info" title="2nd drawer" />
          {navigationButtons}
        </Flex>
      </QueuedDrawer>

      <QueuedDrawer
        isRequestingToBeOpened={isDrawer3Open}
        onClose={handleDrawer3Close}
        preventBackdropClick
      >
        <Flex p="4">
          <Alert type="info" title="3rd drawer" />
          {navigationButtons}
        </Flex>
      </QueuedDrawer>

      <QueuedDrawer
        isRequestingToBeOpened={isDrawer4Open}
        onClose={handleDrawer4Close}
        preventBackdropClick
      >
        <Flex p="4">
          <Alert type="info" title="4th drawer waited to be displayed 🧑‍🎓" />
        </Flex>
      </QueuedDrawer>

      <QueuedDrawer
        isForcingToBeOpened={isDrawer5ForcingToBeOpened}
        onClose={handleDrawer5Close}
        preventBackdropClick
      >
        <Flex p="4">
          <Alert type="info" title="5th drawer forced its way up here ⚔️" />
        </Flex>
      </QueuedDrawer>

      <QueuedDrawer
        isRequestingToBeOpened={isDrawer6AOpen}
        onClose={handleDrawer6AClose}
        preventBackdropClick
      >
        <Flex p="4">
          <Alert type="info" title="Drawer A" />
        </Flex>
      </QueuedDrawer>

      <QueuedDrawer
        isRequestingToBeOpened={isDrawer6BOpen}
        onClose={handleDrawer6BClose}
        preventBackdropClick
      >
        <Flex p="4">
          <Alert type="info" title="Drawer B 🥳" />
        </Flex>
      </QueuedDrawer>

      {areDrawersLocked && <LockModal />}
    </>
  );
}
