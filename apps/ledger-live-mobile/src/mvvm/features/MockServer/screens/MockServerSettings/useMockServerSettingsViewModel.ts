import { useCallback, useMemo } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import { getEnv } from "@shared/env";
import type { MockServerSettingsFormProps } from "@features/flow-device-mock-server";
import { useSelector } from "~/context/hooks";
import type { ScreenName } from "~/const";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { SettingsNavigatorStackParamList } from "~/components/RootNavigator/types/SettingsNavigator";
import { mockServerSettingsSelector } from "~/reducers/settings";
import { useApplyMockServerSessionChange } from "../../hooks/useApplyMockServerSessionChange";

type MockServerSettingsNavigatorProps = StackNavigatorProps<
  SettingsNavigatorStackParamList,
  ScreenName.DebugMockServer
>;

export function useMockServerSettingsViewModel(): MockServerSettingsFormProps {
  const settings = useSelector(mockServerSettingsSelector);
  const onApply = useApplyMockServerSessionChange();
  const { url: deeplinkUrl, token: deeplinkToken } =
    useRoute<MockServerSettingsNavigatorProps["route"]>().params ?? {};
  const navigation = useNavigation<MockServerSettingsNavigatorProps["navigation"]>();

  const activationRequest = useMemo(
    () => (deeplinkUrl ? { url: deeplinkUrl, token: deeplinkToken } : undefined),
    [deeplinkToken, deeplinkUrl],
  );

  const onActivationRequestHandled = useCallback(
    () => navigation.setParams({ url: undefined, token: undefined }),
    [navigation],
  );

  return {
    settings,
    defaultUrl: getEnv("MOCK_SERVER_TRANSPORT_URL"),
    sessionImport: getEnv("MOCK_SERVER_SESSION"),
    seed: getEnv("MOCK_SERVER_SEED").trim() || undefined,
    onApply,
    activationRequest,
    onActivationRequestHandled,
  };
}
