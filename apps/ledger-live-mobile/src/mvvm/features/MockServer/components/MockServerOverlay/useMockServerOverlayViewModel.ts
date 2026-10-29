import { useCallback, useEffect, useState } from "react";
import Config from "react-native-config";
import { getConfiguredMockServerTransport } from "@ledgerhq/live-dmk-mobile";
import { getMockServerStatus } from "@ledgerhq/live-dmk-shared";
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
      const next = await getMockServerStatus(connection);
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
