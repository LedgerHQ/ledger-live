import type { SessionReconnect } from "./useSessionReconnect";

export type ReconnectSheetProps = Readonly<{
  connection: SessionReconnect | null;
  productName: string;
  suspendSheets: boolean;
  /** Replaces the default close, which only hides the sheet until the next connection state. */
  onQuit?: () => void;
}>;
