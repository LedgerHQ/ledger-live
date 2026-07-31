import { useState } from "react";
import type { MessageMap, Transport } from "@devtools/transport";

export function useTransportSend<M extends MessageMap>(transport: Transport<M>) {
  const [kind, setKind] = useState("debug");
  const [sendMessage, setSendMessage] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);

  function handleSend() {
    try {
      transport.send(kind as keyof M, sendMessage as M[keyof M]);
      setSendError(null);
    } catch (e) {
      setSendError(e instanceof Error ? e.message : String(e));
    }
  }

  return { kind, setKind, sendMessage, setSendMessage, sendError, handleSend };
}
