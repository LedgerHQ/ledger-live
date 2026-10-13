import { exchangeDeviceSession, useManifestExchangeDeviceSession } from "../../session";
import type { ExchangeDeviceSession } from "../../session";

type Props = Readonly<{
  manifestId: string;
  store?: ExchangeDeviceSession;
}>;

/** The open session of the live app, if it owns one. */
export function useExchangeDeviceDrawerViewModel({
  manifestId,
  store = exchangeDeviceSession,
}: Props) {
  const session = useManifestExchangeDeviceSession(manifestId, store);

  return { session };
}
