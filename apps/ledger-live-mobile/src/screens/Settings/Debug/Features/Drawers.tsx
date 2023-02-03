import React, { useCallback, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { Flex, Alert, Switch, Button, Text } from "@ledgerhq/native-ui";
import QueuedDrawer from "../../../../components/QueuedDrawer";
import { StackNavigatorNavigation } from "../../../../components/RootNavigator/types/helpers";
import { SettingsNavigatorStackParamList } from "../../../../components/RootNavigator/types/SettingsNavigator";
import { ScreenName } from "../../../../const";

/**
 * Debugging screen to test:
 * - opening/closing 1 drawer
 * - opening/closing successive drawers
 * - opening/closing drawers after navigating and coming back
 */
export default function DebugDrawers() {
  const navigation =
    useNavigation<StackNavigatorNavigation<SettingsNavigatorStackParamList>>();

  const [isDrawer1Open, setIsDrawer1Open] = useState(false);
  const [isDrawer2Open, setIsDrawer2Open] = useState(false);
  const [isDrawer3Open, setIsDrawer3Open] = useState(false);

  const handleDrawer1Close = useCallback(() => {
    setIsDrawer1Open(false);
  }, []);

  const handleDrawer2Close = useCallback(() => {
    setIsDrawer2Open(false);
  }, []);

  const handleDrawer3Close = useCallback(() => {
    setIsDrawer3Open(false);
  }, []);

  return (
    <>
      <Flex p="4">
        <Flex mb="2">
          <Switch
            checked={isDrawer1Open}
            onChange={val => setIsDrawer1Open(val)}
            label={"Open the 1st drawer"}
          />
        </Flex>
        <Flex mb="2">
          <Switch
            checked={isDrawer2Open}
            onChange={val => {
              setIsDrawer1Open(val);
              setIsDrawer2Open(val);
            }}
            label={"Open the 1st then 2nd drawers"}
          />
        </Flex>
        <Flex mb="6">
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
        <Alert
          type="info"
          title="Hey 🧙‍♀️ Test successive opening/closing drawers !"
        />
        <Flex mt="6">
          <Text>
            Also, try navigating to a new screen by clicking on the button and
            come back here with the back arrow. To check if the drawers are
            still working.
          </Text>

          <Button
            type="main"
            onPress={() => navigation.navigate(ScreenName.DebugLottie)}
            mt="4"
            size="small"
            outline
          >
            Navigate somewhere 🧞‍♂️
          </Button>
        </Flex>
      </Flex>

      <QueuedDrawer
        isRequestingToBeOpened={isDrawer1Open}
        onClose={handleDrawer1Close}
        preventBackdropClick
      >
        <Flex p="4">
          <Alert type="info" title="1st drawer" />
        </Flex>
      </QueuedDrawer>

      <QueuedDrawer
        isRequestingToBeOpened={isDrawer2Open}
        onClose={handleDrawer2Close}
        preventBackdropClick
      >
        <Flex p="4">
          <Alert type="info" title="2nd drawer" />
        </Flex>
      </QueuedDrawer>

      <QueuedDrawer
        isRequestingToBeOpened={isDrawer3Open}
        onClose={handleDrawer3Close}
        preventBackdropClick
      >
        <Flex p="4">
          <Alert type="info" title="3rd drawer" />
        </Flex>
      </QueuedDrawer>
    </>
  );
}
