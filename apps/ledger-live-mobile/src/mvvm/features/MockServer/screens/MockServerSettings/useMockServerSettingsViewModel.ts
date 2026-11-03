import { useCallback, useState } from "react";
import { Alert, Linking } from "react-native";
import { getEnv } from "@shared/env";
import { copyToClipboard } from "@shared/clipboard";
import { getMockServerConfigurationUiUrl, stripTrailingSlashes } from "@ledgerhq/live-dmk-shared";
import { useSelector } from "~/context/hooks";
import { mockServerConfigSelector, mockServerSettingsSelector } from "~/reducers/settings";
import { useMockServerSessionActions } from "../../hooks/useMockServerSessionActions";
import { useMockServerStatus } from "../../hooks/useMockServerStatus";
import type { MockServerStatus } from "../../types";

type PendingAction = "toggle" | "apply" | "newSession";

export type MockServerSettingsViewModel = {
  isEnabled: boolean;
  status: MockServerStatus;
  sessionId: string | null;
  urlDraft: string;
  tokenDraft: string;
  hasDraftChanges: boolean;
  pendingAction: PendingAction | null;
  error: string | null;
  onToggle: (enabled: boolean) => void;
  onChangeUrlDraft: (url: string) => void;
  onChangeTokenDraft: (token: string) => void;
  onApply: () => void;
  onNewSession: () => void;
  onCopyToken: () => void;
  onOpenConfigurationUi: () => void;
};

const normalizeUrl = (url: string) => stripTrailingSlashes(url.trim());
const toErrorMessage = (e: unknown) => (e instanceof Error ? e.message : String(e));

export function useMockServerSettingsViewModel(): MockServerSettingsViewModel {
  const config = useSelector(mockServerConfigSelector);
  const { url } = useSelector(mockServerSettingsSelector);
  const { status, sessionId } = useMockServerStatus(config);
  const { startNewSession, joinSession, disable } = useMockServerSessionActions();
  const [urlDraft, setUrlDraft] = useState(url || getEnv("MOCK_SERVER_TRANSPORT_URL"));
  const [tokenDraft, setTokenDraft] = useState(config?.token ?? "");
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [error, setError] = useState<string | null>(null);

  const draftUrl = normalizeUrl(urlDraft);
  const draftToken = tokenDraft.trim();
  const isTokenChanged = draftToken !== (config?.token ?? "");
  const isUrlChanged = draftUrl !== url;
  const joinsDraftSession = isTokenChanged && draftToken !== "";

  const run = useCallback(async (action: PendingAction, task: () => Promise<void>) => {
    setPendingAction(action);
    setError(null);
    try {
      await task();
    } catch (e) {
      setError(toErrorMessage(e));
      setPendingAction(null);
    }
  }, []);

  const applyDrafts = useCallback(
    () => (joinsDraftSession ? joinSession(draftUrl, draftToken) : startNewSession(draftUrl)),
    [draftToken, draftUrl, joinSession, joinsDraftSession, startNewSession],
  );

  const onToggle = useCallback(
    (nextEnabled: boolean) => {
      Alert.alert(
        nextEnabled ? "Turn on the mock server?" : "Turn off the mock server?",
        "The app will restart to apply the mock server settings.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Restart",
            onPress: () => run("toggle", () => (nextEnabled ? applyDrafts() : disable())),
          },
        ],
      );
    },
    [applyDrafts, disable, run],
  );

  const onApply = useCallback(() => {
    run("apply", applyDrafts);
  }, [applyDrafts, run]);

  const onNewSession = useCallback(() => {
    run("newSession", () => startNewSession(draftUrl));
  }, [draftUrl, run, startNewSession]);

  const onCopyToken = useCallback(() => {
    if (config) copyToClipboard(config.token);
  }, [config]);

  const onOpenConfigurationUi = useCallback(() => {
    if (!config) return;
    Linking.openURL(getMockServerConfigurationUiUrl(config.url, config.token)).catch(e =>
      setError(toErrorMessage(e)),
    );
  }, [config]);

  return {
    isEnabled: config !== null,
    status,
    sessionId,
    urlDraft,
    tokenDraft,
    hasDraftChanges: joinsDraftSession || isUrlChanged,
    pendingAction,
    error,
    onToggle,
    onChangeUrlDraft: setUrlDraft,
    onChangeTokenDraft: setTokenDraft,
    onApply,
    onNewSession,
    onCopyToken,
    onOpenConfigurationUi,
  };
}
