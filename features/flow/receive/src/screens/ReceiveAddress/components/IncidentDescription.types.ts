import type { ReceiveIncidentTextPartView } from "../ReceiveAddressView.types";

export type IncidentDescriptionProps = Readonly<{
  parts: readonly ReceiveIncidentTextPartView[];
}>;
