import React from "react";
import { Desktop } from "@ledgerhq/lumen-ui-rnative/symbols";
import { InfoState } from "@shared/ui-info-state";
import { Trans } from "@shared/i18n";

type UpdateOnDesktopContentProps = Readonly<{
  productName: string;
  onGotIt: () => void;
}>;

export function UpdateOnDesktopContent({ productName, onGotIt }: UpdateOnDesktopContentProps) {
  return (
    <InfoState
      preset="spot"
      spotProps={{ icon: Desktop }}
      size="hug"
      title={<Trans i18nKey="osUpdates.updateOnDesktop.title" />}
      description={
        <Trans i18nKey="osUpdates.updateOnDesktop.description" values={{ productName }} />
      }
      primaryCta={{
        label: <Trans i18nKey="osUpdates.updateOnDesktop.gotIt" />,
        onPress: onGotIt,
        testID: "os-update-on-desktop-got-it",
      }}
      testID="os-update-on-desktop"
    />
  );
}
