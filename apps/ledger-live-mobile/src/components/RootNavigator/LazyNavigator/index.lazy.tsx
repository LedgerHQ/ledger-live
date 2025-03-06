import React from "react";
import { NavigatorName } from "~/const";
import { registerAppScreen } from "LLM/performance/apis";
import { Flex, Text } from "@ledgerhq/native-ui";

export const BaseNavigator = registerAppScreen<
  typeof import("~/components/RootNavigator/BaseNavigator").default
>({
  loader: () => import("~/components/RootNavigator/BaseNavigator"),
  name: NavigatorName.Base,
  placeholder: (
    <Flex flex={1} bg="red">
      <Text>{"Loading base..."}</Text>
    </Flex>
  ),
});

export const BaseOnboardingNavigator = registerAppScreen<
  typeof import("~/components/RootNavigator/BaseOnboardingNavigator").default
>({
  loader: () => import("~/components/RootNavigator/BaseOnboardingNavigator"),
  name: NavigatorName.BaseOnboarding,
  placeholder: (
    <Flex flex={1} bg="red">
      <Text>{"Loading onboarding..."}</Text>
    </Flex>
  ),
});
