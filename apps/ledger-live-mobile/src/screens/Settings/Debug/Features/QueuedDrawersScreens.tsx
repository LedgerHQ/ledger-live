import React from "react";
import { Button, Flex, Text } from "@ledgerhq/native-ui";
import { useNavigation } from "@react-navigation/core";
import QueuedDrawer from "~/components/QueuedDrawer";
import { ScreenName } from "~/const";

export function DebugQueuedScreen1() {
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(true);
  const navigation = useNavigation();

  const navigateToMainScreen = () => {
    navigation.navigate(ScreenName.DebugQueuedDrawers);
  };

  const navigateToScreen2 = () => {
    navigation.navigate(ScreenName.DebugQueuedDrawerScreen2);
  };

  const navigationButtons = (
    <Flex>
      <Button type="main" outline onPress={navigateToMainScreen}>
        {"navigate to main debug screen"}
      </Button>
      <Button type="main" outline onPress={navigateToScreen2}>
        {"navigate to screen 2 that has an open drawer"}
      </Button>
      <Button type="main" outline onPress={() => setIsDrawerOpen(true)}>
        {"open drawer"}
      </Button>
    </Flex>
  );

  return (
    <Flex>
      <Text>DebugQueuedScreen1</Text>
      {navigationButtons}
      <QueuedDrawer isRequestingToBeOpened={isDrawerOpen} onClose={() => setIsDrawerOpen(false)}>
        {navigationButtons}
      </QueuedDrawer>
    </Flex>
  );
}

export function DebugQueuedScreen2() {
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(true);
  const navigation = useNavigation();

  const navigateToMainScreen = () => {
    navigation.navigate(ScreenName.DebugQueuedDrawers);
  };

  const navigationButtons = (
    <Flex>
      <Button type="main" outline onPress={navigateToMainScreen}>
        {"navigate to main debug screen"}
      </Button>
      <Button type="main" outline onPress={() => setIsDrawerOpen(true)}>
        {"open drawer"}
      </Button>
    </Flex>
  );

  return (
    <Flex>
      <Text>DebugQueuedScreen2</Text>
      {navigationButtons}
      <QueuedDrawer isRequestingToBeOpened={isDrawerOpen} onClose={() => setIsDrawerOpen(false)}>
        {navigationButtons}
      </QueuedDrawer>
    </Flex>
  );
}
