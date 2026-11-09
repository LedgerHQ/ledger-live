import { createContext, createElement, useContext, type ReactNode } from "react";
import type { SendFlowPorts } from "./ports";

const SendFlowPortsContext = createContext<SendFlowPorts | null>(null);

export class SendFlowPortsMissingError extends Error {
  override name = "SendFlowPortsMissingError";
  constructor() {
    super("useSendFlowPorts must be used under a <SendFlowPortsProvider>");
  }
}

export function SendFlowPortsProvider({
  ports,
  children,
}: Readonly<{ ports: SendFlowPorts; children?: ReactNode }>) {
  return createElement(SendFlowPortsContext.Provider, { value: ports }, children);
}

export function useSendFlowPorts(): SendFlowPorts {
  const ports = useContext(SendFlowPortsContext);
  if (!ports) throw new SendFlowPortsMissingError();
  return ports;
}
