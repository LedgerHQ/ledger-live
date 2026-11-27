import { useCallback, useState } from "react";
import { useOpenLink } from "@shared/linking";
import { useSettingsAboutLabels } from "./copy/useSettingsAboutLabels";
import { nextVersionTapState } from "./logic/versionTaps";
import type {
  SettingsAboutProps,
  SettingsAboutRowId,
  SettingsAboutViewProps,
} from "./SettingsAbout.types";
import { socialUrls } from "./urls";

export function useSettingsAboutViewModel({
  port,
  testID,
}: SettingsAboutProps): SettingsAboutViewProps {
  const labels = useSettingsAboutLabels();
  const openLink = useOpenLink();
  const [taps, setTaps] = useState(0);

  const onVersionPress = useCallback(() => {
    port.onRowSelect?.("version");
    const next = nextVersionTapState(taps);
    setTaps(next.count);
    if (next.unlocked) port.unlockDeveloperTools();
  }, [taps, port]);

  const onFeedbackPress = useCallback(() => {
    port.onRowSelect?.("feedback");
    port.feedback?.();
  }, [port]);

  const externalLink = (rowId: SettingsAboutRowId, url: string) => ({
    type: "externalLink" as const,
    onSelect: () => {
      port.onRowSelect?.(rowId);
      return openLink(url);
    },
  });

  const feedbackRows = port.feedback
    ? [
        {
          id: "feedback" as const,
          title: labels.feedback.title,
          onSelect: onFeedbackPress,
          testID: "settings-about-feedback",
        },
      ]
    : [];

  const rateRows = port.storeReview
    ? [
        {
          id: "rate" as const,
          title: labels.rate.title(port.storeReview.storeName),
          trailing: externalLink("rate", port.storeReview.url),
          testID: "settings-about-rate",
        },
      ]
    : [];

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
            trailing: externalLink("terms", port.termsUrl),
            testID: "settings-about-terms",
          },
        ],
      },
      {
        id: "social",
        title: labels.connect.title,
        rows: [
          ...feedbackRows,
          ...rateRows,
          {
            id: "x",
            title: labels.connect.x,
            trailing: externalLink("x", socialUrls.twitter),
            testID: "settings-about-x",
          },
          {
            id: "instagram",
            title: labels.connect.instagram,
            trailing: externalLink("instagram", socialUrls.instagram),
            testID: "settings-about-instagram",
          },
          {
            id: "github",
            title: labels.connect.github,
            trailing: externalLink("github", socialUrls.github),
            testID: "settings-about-github",
          },
        ],
      },
    ],
  };
}
