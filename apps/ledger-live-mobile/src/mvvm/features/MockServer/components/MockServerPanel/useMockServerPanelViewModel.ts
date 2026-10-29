import { useCallback, useState } from "react";
import { copyToClipboard } from "@shared/clipboard";
import { getMockServerFrontendUrl } from "@ledgerhq/live-dmk-mobile";
import { useMockServerSessionActions } from "../../hooks/useMockServerSessionActions";
import { useDispatch, useSelector } from "~/context/hooks";
import { setMockServerFloatingButtonHidden, setMockServerPanelOpen } from "~/actions/appstate";
import { isMockServerFloatingButtonHiddenSelector } from "~/reducers/appstate";
import type { MockServerConnection, MockServerStatus } from "../../types";

export type MockServerPanelProps = {
  connection: MockServerConnection;
  status: MockServerStatus;
  sessionId: string | null;
};

type PendingAction = "apply" | "newSession";

export type MockServerPanelViewModel = {
  status: MockServerStatus;
  sessionId: string | null;
  token: string;
  frontendUrl: string;
  urlDraft: string;
  tokenDraft: string;
  hasDraftChanges: boolean;
  pendingAction: PendingAction | null;
  error: string | null;
  isFloatingButtonHidden: boolean;
  onChangeUrlDraft: (url: string) => void;
  onChangeTokenDraft: (token: string) => void;
  onApply: () => void;
  onNewSession: () => void;
  onCopyToken: () => void;
  onSetFloatingButtonHidden: (hidden: boolean) => void;
  onClose: () => void;
};

const normalizeUrl = (url: string) => url.trim().replace(/\/+$/, "");

export function useMockServerPanelViewModel({
  connection,
  status,
  sessionId,
}: MockServerPanelProps): MockServerPanelViewModel {
  const { startNewSession, joinSession } = useMockServerSessionActions();
  const dispatch = useDispatch();
  const isFloatingButtonHidden = useSelector(isMockServerFloatingButtonHiddenSelector);
  const [urlDraft, setUrlDraft] = useState(connection.url);
  const [tokenDraft, setTokenDraft] = useState(connection.token);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [error, setError] = useState<string | null>(null);

  const draftUrl = normalizeUrl(urlDraft);
  const draftToken = tokenDraft.trim();
  const isTokenChanged = draftToken !== connection.token;
  const isUrlChanged = draftUrl !== connection.url;

  const run = useCallback(async (action: PendingAction, task: () => Promise<void>) => {
    setPendingAction(action);
    setError(null);
    try {
      await task();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setPendingAction(null);
    }
  }, []);

  const onApply = useCallback(() => {
    run("apply", () =>
      isTokenChanged ? joinSession(draftUrl, draftToken) : startNewSession(draftUrl),
    );
  }, [draftToken, draftUrl, isTokenChanged, joinSession, run, startNewSession]);

  const onNewSession = useCallback(() => {
    run("newSession", () => startNewSession(draftUrl));
  }, [draftUrl, run, startNewSession]);

  const onSetFloatingButtonHidden = useCallback(
    (hidden: boolean) => dispatch(setMockServerFloatingButtonHidden(hidden)),
    [dispatch],
  );

  const onClose = useCallback(() => dispatch(setMockServerPanelOpen(false)), [dispatch]);

  const onCopyToken = useCallback(() => {
    copyToClipboard(connection.token);
  }, [connection.token]);

  return {
    status,
    sessionId,
    token: connection.token,
    frontendUrl: getMockServerFrontendUrl(connection.url, connection.token),
    urlDraft,
    tokenDraft,
    hasDraftChanges: (isTokenChanged && draftToken !== "") || isUrlChanged,
    pendingAction,
    error,
    isFloatingButtonHidden,
    onChangeUrlDraft: setUrlDraft,
    onChangeTokenDraft: setTokenDraft,
    onApply,
    onNewSession,
    onCopyToken,
    onSetFloatingButtonHidden,
    onClose,
  };
}
