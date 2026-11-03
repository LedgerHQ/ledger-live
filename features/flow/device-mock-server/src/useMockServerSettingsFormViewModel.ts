import { useCallback, useMemo, useState } from "react";
import { Alert, Linking } from "react-native";
import { copyToClipboard } from "@shared/clipboard";
import {
  getMockServerConfig,
  getMockServerConfigurationUiUrl,
  stripTrailingSlashes,
} from "@features/platform-device-mock-server";
import { createMockServerSessionActions } from "./model/mockServerSessionActions";
import type { MockServerSettingsFormProps } from "./MockServerSettingsForm.types";
import type { MockServerStatus } from "./types";
import { useMockServerStatus } from "./useMockServerStatus";

type PendingAction = "toggle" | "apply" | "newSession";

export type MockServerSettingsFormViewModel = {
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

export function useMockServerSettingsFormViewModel({
  settings: { enabled, url, token },
  defaultUrl,
  host,
}: MockServerSettingsFormProps): MockServerSettingsFormViewModel {
  const config = useMemo(() => getMockServerConfig({ enabled, url, token }), [enabled, url, token]);
  const { status, sessionId } = useMockServerStatus(config);
  const { startNewSession, joinSession, disable } = useMemo(
    () => createMockServerSessionActions(host),
    [host],
  );
  const [urlDraft, setUrlDraft] = useState(url || defaultUrl);
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
            onPress: () => run("toggle", () => (nextEnabled ? applyDrafts() : disable(url))),
          },
        ],
      );
    },
    [applyDrafts, disable, run, url],
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
