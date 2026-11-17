import type { SessionReconnect } from "./useSessionReconnect";

export type ReconnectSheetProps = Readonly<{
  connection: SessionReconnect | null;
  productName: string;
  suspendSheets: boolean;
}>;
