import React from "react";
import { Trans } from "react-i18next";
import { State } from "@ledgerhq/live-common/apps/index";
import * as Animatable from "react-native-animatable";
import { updateAllProgress } from "@ledgerhq/live-common/apps/logic";
import { Flex, Text, ProgressBar } from "@ledgerhq/native-ui";

const AnimatedFlex = Animatable.createAnimatableComponent(Flex);

type Props = {
  state: State;
  disabled?: boolean;
};

const AppUpdateStepper = ({ state }: Props) => {
  const { updateAllQueue } = state;
  const updateProgress = updateAllProgress(state);

  if (updateProgress === 1) return null;

  const count = updateAllQueue.length;

  return (
    <AnimatedFlex
      animation="fadeIn"
      useNativeDriver
      duration={400}
      flexDirection="row"
      alignItems="center"
      bg="neutral.c30"
      borderRadius={4}
      p={6}
    >
      <Flex flexDirection="column" flex={1}>
        <Text variant="large" fontWeight="semiBold">
          <Trans
            i18nKey="AppAction.update.title"
            count={count}
            values={{
              number: count,
            }}
          />
        </Text>
        <Text fontSize="small" color="neutral.c80">
          <Trans i18nKey="AppAction.update.updateWarn" />
        </Text>
      </Flex>
      <Flex ml={4} flexDirection="column">
        <Text variant="small" fontWeight="semiBold">
          <Trans i18nKey="AppAction.update.progress" />
        </Text>
        <ProgressBar length={100} index={Math.floor(updateProgress * 100)} />
      </Flex>
    </AnimatedFlex>
  );
};

export default AppUpdateStepper;
