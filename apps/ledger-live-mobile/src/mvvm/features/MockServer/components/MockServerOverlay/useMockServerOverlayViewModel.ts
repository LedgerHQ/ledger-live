import { useCallback, useEffect, useState } from "react";
import Config from "react-native-config";
import {
  getConfiguredMockServerTransport,
  getMockServerSession,
  isMockServerReachable,
} from "@ledgerhq/live-dmk-mobile";
import { useDispatch, useSelector } from "~/context/hooks";
import { setMockServerPanelOpen } from "~/actions/appstate";
import {
  isMockServerFloatingButtonHiddenSelector,
  isMockServerPanelOpenSelector,
} from "~/reducers/appstate";
import type { MockServerConnection, MockServerStatus } from "../../types";

const STATUS_POLL_INTERVAL_MS = 5000;

export type MockServerOverlayViewModel = {
  connection: MockServerConnection | null;
  status: MockServerStatus;
  sessionId: string | null;
  isPanelOpen: boolean;
  isFloatingButtonVisible: boolean;
  onToggleOpenPanel: () => void;
};

const readStatus = async ({
  url,
  token,
}: MockServerConnection): Promise<{ status: MockServerStatus; sessionId: string | null }> => {
  if (!(await isMockServerReachable(url))) return { status: "unreachable", sessionId: null };
  try {
    const session = await getMockServerSession({ url, token });
    return { status: "connected", sessionId: session.id };
  } catch {
    return { status: "sessionExpired", sessionId: null };
  }
};

export function useMockServerOverlayViewModel(): MockServerOverlayViewModel {
  const [connection] = useState(() => (Config.DETOX ? null : getConfiguredMockServerTransport()));
  const dispatch = useDispatch();
  const isPanelOpen = useSelector(isMockServerPanelOpenSelector);
  const isFloatingButtonHidden = useSelector(isMockServerFloatingButtonHiddenSelector);
  const [status, setStatus] = useState<MockServerStatus>("checking");
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (!connection) return;
    let isActive = true;
    const poll = async () => {
      const next = await readStatus(connection);
      if (!isActive) return;
      setStatus(next.status);
      setSessionId(next.sessionId);
    };
    poll();
    const intervalId = setInterval(poll, STATUS_POLL_INTERVAL_MS);
    return () => {
      isActive = false;
      clearInterval(intervalId);
    };
  }, [connection]);

  const onToggleOpenPanel = useCallback(() => {
    dispatch(setMockServerPanelOpen(!isPanelOpen));
  }, [dispatch, isPanelOpen]);

  return {
    connection: connection ?? null,
    status,
    sessionId,
    isPanelOpen,
    isFloatingButtonVisible: !isFloatingButtonHidden,
    onToggleOpenPanel,
  };
}
