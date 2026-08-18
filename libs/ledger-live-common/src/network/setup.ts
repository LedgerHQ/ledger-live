import { getEnv, changes } from "@shared/env";
import { setNetworkState } from "@ledgerhq/live-network";

/**
 * Bridges live-env configuration into live-network's local state.
 * Call once at app boot, after LEDGER_CLIENT_VERSION is set.
 * Returns an unsubscribe function.
 */
export function bridgeEnvToNetworkState(): () => void {
  setNetworkState({
    enableNetworkLogs: getEnv("ENABLE_NETWORK_LOGS"),
    debugHttpResponse: getEnv("DEBUG_HTTP_RESPONSE"),
    ledgerClientVersion: getEnv("LEDGER_CLIENT_VERSION"),
    getCallsTimeout: getEnv("GET_CALLS_TIMEOUT"),
    getCallsRetry: getEnv("GET_CALLS_RETRY"),
  });

  const subscription = changes.subscribe(({ name, value }) => {
    switch (name) {
      case "ENABLE_NETWORK_LOGS":
        setNetworkState({ enableNetworkLogs: value as boolean });
        break;
      case "DEBUG_HTTP_RESPONSE":
        setNetworkState({ debugHttpResponse: value as boolean });
        break;
      case "LEDGER_CLIENT_VERSION":
        setNetworkState({ ledgerClientVersion: value as string });
        break;
      case "GET_CALLS_TIMEOUT":
        setNetworkState({ getCallsTimeout: value as number });
        break;
      case "GET_CALLS_RETRY":
        setNetworkState({ getCallsRetry: value as number });
        break;
    }
  });

  return () => subscription.unsubscribe();
}
