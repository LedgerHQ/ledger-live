import type { OsUpdateScreen } from "./OsUpdateScreen";
import type { OsUpdateSheet } from "./OsUpdateSheet";

export type OsUpdateStepDescriptor = Readonly<{
  screen: OsUpdateScreen;
  sheet?: OsUpdateSheet;
}>;
