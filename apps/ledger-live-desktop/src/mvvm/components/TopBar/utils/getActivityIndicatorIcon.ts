import { Refresh, Warning } from "@ledgerhq/lumen-ui-react/symbols";
import { Spinner } from "@ledgerhq/lumen-ui-react";

export type ActivityIndicatorIcon = typeof Refresh | typeof Warning | typeof Spinner;

export function getActivityIndicatorIcon(
  isError: boolean,
  isRotating: boolean,
): ActivityIndicatorIcon {
  let icon = Refresh;
  if (isError) {
    icon = Warning;
  }
  if (isRotating) {
    icon = Spinner;
  }
  return icon;
}
