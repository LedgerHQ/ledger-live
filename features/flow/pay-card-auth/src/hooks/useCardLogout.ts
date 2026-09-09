import { useCallback, useMemo } from "react";
import { useDispatch } from "react-redux";
import { createCardLogoutPorts } from "../state/createCardLogoutPorts";
import type { CardLoginDispatch } from "../state/createCardLoginPorts";
import { startLogout } from "../state/cardLogout";

export function useCardLogout(): () => void {
  const dispatch = useDispatch<CardLoginDispatch>();
  const ports = useMemo(() => createCardLogoutPorts(dispatch), [dispatch]);
  return useCallback(() => startLogout(ports), [ports]);
}
