import type { PrivacyLabels } from "./copy/usePrivacySettingsLabels";
import { getPrivacyToggleValue, toPrivacyUpdate, type PrivacyRowId } from "./logic/privacyRows";
import type { PrivacySettingsPort } from "./ports";
import type { PrivacyRowViewProps } from "./Privacy.types";
import { trackPrivacyToggle } from "./tracking";
import type { PrivacyPlatform } from "./types";

type RowContext = Readonly<{
  port: PrivacySettingsPort;
  labels: PrivacyLabels;
  platform: PrivacyPlatform;
  openPrivacyPolicy: () => void;
}>;

/** What the View shows for one row: wording, current value and what a press does. */
export function toPrivacyRowViewProps(
  id: PrivacyRowId,
  { port, labels, platform, openPrivacyPolicy }: RowContext,
): PrivacyRowViewProps {
  const base = { id, testID: `setting-${id}`, ...labels[id] };

  if (id === "privacyPolicy") {
    return { ...base, trailing: { type: "externalLink", onSelect: openPrivacyPolicy } };
  }

  return {
    ...base,
    trailing: {
      type: "toggle",
      value: getPrivacyToggleValue(id, port.values),
      onToggle: value => {
        port.setValue(toPrivacyUpdate(id, value));
        trackPrivacyToggle(id, value, platform);
      },
    },
  };
}
