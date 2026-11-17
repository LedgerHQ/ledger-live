import { useCallback, useState } from "react";
import { Alert, Linking } from "react-native";
import { useDispatch } from "react-redux";
import { copyToClipboard, readClipboard } from "@shared/clipboard";
import {
  getMockServerConfigurationUiUrl,
  listMockServerDevices,
  type MockServerConfig,
} from "@features/platform-device-mock-server";
import { joinMockServerSession, startMockServerSession } from "../../../../mockServerSession";
import { setMockServerOverlayMode } from "../../../../state/slice";
import type { MockServerStatus } from "../../../../useMockServerStatus";
import type { MockServerOverlayProps } from "../../types";

export type MockServerPanelProps = Pick<
  MockServerOverlayProps,
  "sessionImport" | "seed" | "onApply" | "onOpenSettings" | "onSaveKnownDevices"
> &
  Readonly<{
    config: MockServerConfig;
    status: MockServerStatus;
  }>;

type PendingAction = "joinSession" | "newSession" | "saveKnownDevices";

export type MockServerPanelViewModel = {
  status: MockServerStatus;
  configurationUiUrl: string;
  pendingAction: PendingAction | null;
  error: string | null;
  onCopyToken: () => void;
  onPasteToken: () => void;
  onNewSession: () => void;
  onSaveDevicesToKnownDevices: () => void;
  onOpenConfigurationUi: () => void;
  onOpenSettings: () => void;
  onClose: () => void;
};

const toErrorMessage = (e: unknown) => (e instanceof Error ? e.message : String(e));

export function useMockServerPanelViewModel({
  config,
  status,
  sessionImport,
  seed,
  onApply,
  onOpenSettings: openSettings,
  onSaveKnownDevices,
}: MockServerPanelProps): MockServerPanelViewModel {
  const dispatch = useDispatch();
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const configurationUiUrl = getMockServerConfigurationUiUrl(config.url, config.token);

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

  const onCopyToken = useCallback(() => {
    copyToClipboard(config.token);
  }, [config.token]);

  const onPasteToken = useCallback(async () => {
    const token = (await readClipboard()).trim();
    if (!token) {
      setError("The clipboard has no session token.");
      return;
    }
    Alert.alert("Join this session?", `Token ${token}\n\nThe app will restart.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Join",
        onPress: () =>
          run("joinSession", async () => onApply(await joinMockServerSession(config.url, token))),
      },
    ]);
  }, [config.url, onApply, run]);

  const onNewSession = useCallback(() => {
    run("newSession", async () =>
      onApply(await startMockServerSession(config.url, { sessionImport, seed })),
    );
  }, [config.url, onApply, run, seed, sessionImport]);

  const onSaveDevicesToKnownDevices = useCallback(() => {
    run("saveKnownDevices", async () => {
      onSaveKnownDevices(await listMockServerDevices(config));
      setPendingAction(null);
    });
  }, [config, onSaveKnownDevices, run]);

  const onOpenConfigurationUi = useCallback(() => {
    Linking.openURL(configurationUiUrl).catch(e => setError(toErrorMessage(e)));
  }, [configurationUiUrl]);

  const onClose = useCallback(
    () => dispatch(setMockServerOverlayMode({ type: "hidden" })),
    [dispatch],
  );

  const onOpenSettings = useCallback(() => {
    dispatch(setMockServerOverlayMode({ type: "hidden" }));
    openSettings();
  }, [dispatch, openSettings]);

  return {
    status,
    configurationUiUrl,
    pendingAction,
    error,
    onCopyToken,
    onPasteToken,
    onNewSession,
    onSaveDevicesToKnownDevices,
    onOpenConfigurationUi,
    onOpenSettings,
    onClose,
  };
}
