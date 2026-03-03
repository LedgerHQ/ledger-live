import { listen } from "@ledgerhq/logs";
import type { ProxyJobOpts } from "./types";

type EmitLog = (line: string) => void;

export const startLogBridge = (
  { silent, verbose }: Partial<ProxyJobOpts>,
  emit: EmitLog,
): (() => void) => {
  const unsubscribeLogs = listen(entry => {
    if (verbose) {
      emit(`${entry.type}: ${entry.message}`);
    } else if (!silent && entry.type === "proxy") {
      emit(entry.message ?? "");
    }
  });

  return () => {
    unsubscribeLogs();
  };
};
