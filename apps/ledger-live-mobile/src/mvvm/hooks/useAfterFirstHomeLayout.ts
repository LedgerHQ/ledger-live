import { useEffect, useState } from "react";
import { afterFirstHomeLayout } from "LLM/utils/startupTimeMarkerState";

export function useAfterFirstHomeLayout(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => afterFirstHomeLayout(() => setReady(true)), []);
  return ready;
}
