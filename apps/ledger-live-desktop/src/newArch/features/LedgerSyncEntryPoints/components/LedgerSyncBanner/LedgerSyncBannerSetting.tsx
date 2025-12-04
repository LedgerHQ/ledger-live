import React from "react";
import { Icons } from "@ledgerhq/react-ui";
import Button from "~/renderer/components/Button";
import { LedgerSyncBannerBase } from "./LedgerSyncBannerBase";

export function LedgerSyncBannerSetting({ onPress }: Readonly<{ onPress: () => void }>) {
  return (
    <LedgerSyncBannerBase
      icon={<Icons.Refresh size="M" color="neutral.c80" />}
      titleKey="walletSync.title"
      descriptionKey="walletSync.banner.description"
      ctaKey="walletSync.banner.cta"
      onPress={onPress}
      renderButton={(ctaText, onPress) => (
        <Button primary outline={false} onClick={onPress}>
          {ctaText}
        </Button>
      )}
      iconContainerStyle={{
        width: 36,
        height: 36,
        alignItems: "center",
        justifyContent: "center",
      }}
    />
  );
}

export default LedgerSyncBannerSetting;
