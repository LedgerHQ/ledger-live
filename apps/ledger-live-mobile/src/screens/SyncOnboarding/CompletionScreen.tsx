import React, { useCallback, useEffect, useState } from "react";
import { Flex } from "@ledgerhq/native-ui";
import { useDispatch } from "react-redux";
import { StackScreenProps } from "@react-navigation/stack";
import { TouchableWithoutFeedback } from "react-native-gesture-handler";

import { NavigatorName } from "../../const";
import type { SyncOnboardingStackParamList } from "../../components/RootNavigator/SyncOnboardingNavigator";
import Illustration from "../../images/illustration/Illustration";
import DeviceDark from "../../images/illustration/Dark/_000_PLACEHOLDER.png";
import DeviceLight from "../../images/illustration/Light/_000_PLACEHOLDER.png";

const redirectDelay = 5000;

type Props = StackScreenProps<
  SyncOnboardingStackParamList,
  "SyncOnboardingCompanion"
>;

const CompletionScreen = ({ navigation }: Props) => {
  const dispatch = useDispatch();
  const [delay, setDelay] = useState<NodeJS.Timeout | null>(null);

  const redirectToPostOnboarding = useCallback(() => {
    navigation.reset({
      index: 0,
      routes: [
        {
          name: NavigatorName.Base,
          state: {
            routes: [
              {
                name: NavigatorName.Main,
              },
            ],
          },
        },
      ],
    });
  }, [dispatch, navigation]);

  const skipDelay = useCallback(() => {
    if (!delay) {
      return;
    }
    clearTimeout(delay);
    setDelay(null);
    redirectToPostOnboarding();
  }, [delay, redirectToPostOnboarding]);

  useEffect(() => {
    setDelay(setTimeout(redirectToPostOnboarding, redirectDelay));
  }, [redirectToPostOnboarding]);

  return (
    <TouchableWithoutFeedback onPress={skipDelay}>
      <Flex
        width="100%"
        height="100%"
        alignItems="center"
        justifyContent="center"
      >
        <Illustration
          lightSource={DeviceLight}
          darkSource={DeviceDark}
          size={300}
        />
      </Flex>
    </TouchableWithoutFeedback>
  );
};

export default CompletionScreen;
