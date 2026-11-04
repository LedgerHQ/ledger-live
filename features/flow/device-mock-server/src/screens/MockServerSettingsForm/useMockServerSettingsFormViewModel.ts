import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Linking } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { copyToClipboard } from "@shared/clipboard";
import {
  getMockServerConfig,
  getMockServerConfigurationUiUrl,
  stripTrailingSlashes,
} from "@features/platform-device-mock-server";
import {
  disableMockServer,
  joinMockServerSession,
  startMockServerSession,
} from "../../mockServerSession";
import { selectIsMockServerFloatingButtonHidden } from "../../state/selectors";
import { setMockServerFloatingButtonHidden, setMockServerOverlayMode } from "../../state/slice";
import { useMockServerStatus, type MockServerStatus } from "../../useMockServerStatus";
import type { MockServerActivation, MockServerSettingsFormProps } from "./types";

type PendingAction = "activate" | "disable" | "apply" | "newSession";

export type MockServerSettingsFormViewModel = {
  isEnabled: boolean;
  status: MockServerStatus;
  sessionId: string | null;
  urlDraft: string;
  tokenDraft: string;
  hasDraftChanges: boolean;
  pendingAction: PendingAction | null;
  error: string | null;
  isFloatingButtonHidden: boolean;
  isActivationWarningOpen: boolean;
  activationUrl: string;
  activationToken: string | null;
  onToggle: (enabled: boolean) => void;
  onChangeUrlDraft: (url: string) => void;
  onChangeTokenDraft: (token: string) => void;
  onApply: () => void;
  onNewSession: () => void;
  onCopyToken: () => void;
  onOpenConfigurationUi: () => void;
  onSetFloatingButtonHidden: (hidden: boolean) => void;
  onOpenPanel: () => void;
  onConfirmActivation: () => void;
  onCloseActivationWarning: () => void;
};

const normalizeUrl = (url: string) => stripTrailingSlashes(url.trim());
const toErrorMessage = (e: unknown) => (e instanceof Error ? e.message : String(e));

export function useMockServerSettingsFormViewModel({
  settings: { enabled, url, token },
  defaultUrl,
  sessionImport,
  seed,
  onApply: applyChange,
  activationRequest,
  onActivationRequestHandled,
}: MockServerSettingsFormProps): MockServerSettingsFormViewModel {
  const dispatch = useDispatch();
  const config = useMemo(() => getMockServerConfig({ enabled, url, token }), [enabled, url, token]);
  const isFloatingButtonHidden = useSelector(selectIsMockServerFloatingButtonHidden);
  const { status, sessionId } = useMockServerStatus(config);
  const [urlDraft, setUrlDraft] = useState(url || defaultUrl);
  const [tokenDraft, setTokenDraft] = useState(config?.token ?? "");
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toggleActivation, setToggleActivation] = useState<MockServerActivation | null>(null);

  const requestedUrl = activationRequest?.url;
  const requestedToken = activationRequest?.token;
  const requestedActivation = useMemo<MockServerActivation | null>(
    () =>
      requestedUrl
        ? { url: normalizeUrl(requestedUrl), token: requestedToken?.trim() || undefined }
        : null,
    [requestedToken, requestedUrl],
  );
  // A restart replays the launch deeplink: a request for the active server is already handled.
  const isRequestAlreadyActive =
    requestedActivation !== null &&
    config !== null &&
    requestedActivation.url === config.url &&
    (requestedActivation.token === undefined || requestedActivation.token === config.token);
  const activation = (isRequestAlreadyActive ? null : requestedActivation) ?? toggleActivation;

  useEffect(() => {
    if (isRequestAlreadyActive) onActivationRequestHandled?.();
  }, [isRequestAlreadyActive, onActivationRequestHandled]);

  const draftUrl = normalizeUrl(urlDraft);
  const draftToken = tokenDraft.trim();
  const isTokenChanged = draftToken !== "" && draftToken !== (config?.token ?? "");
  const isUrlChanged = draftUrl !== url;
  // Joins the session of the token in the field, or starts a new one when the field is empty
  const draftActivation = useMemo<MockServerActivation>(
    () => ({ url: draftUrl, token: draftToken || undefined }),
    [draftToken, draftUrl],
  );

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

  const startNewSession = useCallback(
    async (sessionUrl: string) =>
      applyChange(await startMockServerSession(sessionUrl, { sessionImport, seed })),
    [applyChange, seed, sessionImport],
  );

  const activate = useCallback(
    async ({ url: activationUrl, token: activationToken }: MockServerActivation) =>
      activationToken
        ? applyChange(await joinMockServerSession(activationUrl, activationToken))
        : startNewSession(activationUrl),
    [applyChange, startNewSession],
  );

  const onToggle = useCallback(
    (nextEnabled: boolean) => {
      if (nextEnabled) {
        setToggleActivation(draftActivation);
        return;
      }
      Alert.alert(
        "Turn off the mock server?",
        "The app will restart to apply the mock server settings.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Restart",
            onPress: () => run("disable", () => applyChange(disableMockServer(url))),
          },
        ],
      );
    },
    [applyChange, draftActivation, run, url],
  );

  const onCloseActivationWarning = useCallback(() => {
    onActivationRequestHandled?.();
    setToggleActivation(null);
  }, [onActivationRequestHandled]);

  const onConfirmActivation = useCallback(() => {
    if (!activation || pendingAction !== null) return;
    setUrlDraft(activation.url);
    setTokenDraft(activation.token ?? "");
    onCloseActivationWarning();
    run("activate", () => activate(activation));
  }, [activate, activation, onCloseActivationWarning, pendingAction, run]);

  const onApply = useCallback(() => {
    run("apply", () => activate(draftActivation));
  }, [activate, draftActivation, run]);

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

  const onSetFloatingButtonHidden = useCallback(
    (hidden: boolean) => dispatch(setMockServerFloatingButtonHidden(hidden)),
    [dispatch],
  );

  const onOpenPanel = useCallback(
    () => dispatch(setMockServerOverlayMode({ type: "main" })),
    [dispatch],
  );

  return {
    isEnabled: config !== null,
    status,
    sessionId,
    urlDraft,
    tokenDraft,
    hasDraftChanges: isTokenChanged || isUrlChanged,
    pendingAction,
    error,
    isFloatingButtonHidden,
    isActivationWarningOpen: activation !== null,
    activationUrl: activation?.url ?? "",
    activationToken: activation?.token ?? null,
    onToggle,
    onChangeUrlDraft: setUrlDraft,
    onChangeTokenDraft: setTokenDraft,
    onApply,
    onNewSession,
    onCopyToken,
    onOpenConfigurationUi,
    onSetFloatingButtonHidden,
    onOpenPanel,
    onConfirmActivation,
    onCloseActivationWarning,
  };
}
