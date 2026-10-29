import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { getEnv } from "@shared/env";
import { useSelector } from "~/context/hooks";
import { mockServerSettingsSelector } from "~/reducers/settings";
import { useMockServerSessionActions } from "../../hooks/useMockServerSessionActions";
import { openMockServerPanel } from "../../utils/mockServerPanelStore";

export type MockServerSettingsRowViewModel = {
  isEnabled: boolean;
  isPending: boolean;
  onToggle: (enabled: boolean) => void;
  onOpenPanel: () => void;
};

export function useMockServerSettingsRowViewModel(): MockServerSettingsRowViewModel {
  const { enabled, url } = useSelector(mockServerSettingsSelector);
  const { startNewSession, disable } = useMockServerSessionActions();
  const [isPending, setIsPending] = useState(false);

  const applyToggle = useCallback(
    async (nextEnabled: boolean) => {
      setIsPending(true);
      try {
        if (nextEnabled) await startNewSession(url || getEnv("MOCK_SERVER_TRANSPORT_URL"));
        else await disable();
      } catch (e) {
        setIsPending(false);
        Alert.alert("Mock server error", e instanceof Error ? e.message : String(e));
      }
    },
    [disable, startNewSession, url],
  );

  const onToggle = useCallback(
    (nextEnabled: boolean) => {
      Alert.alert(
        nextEnabled ? "Turn on the mock server?" : "Turn off the mock server?",
        "The app will restart to apply the mock server settings.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Restart", onPress: () => applyToggle(nextEnabled) },
        ],
      );
    },
    [applyToggle],
  );

  return { isEnabled: enabled, isPending, onToggle, onOpenPanel: openMockServerPanel };
}
