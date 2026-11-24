import { useCallback } from "react";
import { useDispatch } from "LLD/hooks/redux";
import { openReceiveFlow, type OpenReceiveFlowData } from "../openReceiveFlow";

export function useOpenReceiveFlow() {
  const dispatch = useDispatch();
  return useCallback((data?: OpenReceiveFlowData) => dispatch(openReceiveFlow(data)), [dispatch]);
}
