import { useCallback, useState } from "react";
import { useOpenLink } from "@shared/linking";
import { useSettingsAboutLabels } from "./copy/useSettingsAboutLabels";
import { nextVersionTapState } from "./logic/versionTaps";
import type { SettingsAboutProps, SettingsAboutViewProps } from "./SettingsAbout.types";

export function useSettingsAboutViewModel({
  port,
  testID,
}: SettingsAboutProps): SettingsAboutViewProps {
  const labels = useSettingsAboutLabels();
  const openLink = useOpenLink();
  const [taps, setTaps] = useState(0);

  const onVersionPress = useCallback(() => {
    const next = nextVersionTapState(taps);
    setTaps(next.count);
    if (next.unlocked) port.unlockDeveloperTools();
  }, [taps, port]);

  const externalLink = (url: string) => ({
    type: "externalLink" as const,
    onSelect: () => openLink(url),
  });

  return {
    testID,
    sections: [
      {
        id: "legal",
        rows: [
          {
            id: "version",
            title: labels.version.title,
            description: port.version,
            onSelect: onVersionPress,
            testID: "settings-about-version",
          },
          {
            id: "terms",
            title: labels.terms.title,
            description: labels.terms.description,
            trailing: externalLink(port.links.terms),
            testID: "settings-about-terms",
          },
        ],
      },
      {
        id: "social",
        title: labels.connect.title,
        rows: [
          {
            id: "x",
            title: labels.connect.x,
            trailing: externalLink(port.links.x),
            testID: "settings-about-x",
          },
          {
            id: "instagram",
            title: labels.connect.instagram,
            trailing: externalLink(port.links.instagram),
            testID: "settings-about-instagram",
          },
          {
            id: "github",
            title: labels.connect.github,
            trailing: externalLink(port.links.github),
            testID: "settings-about-github",
          },
        ],
      },
    ],
  };
}
