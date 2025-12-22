import React from "react";
import { Button } from "@ledgerhq/react-ui";
import Illustration from "~/renderer/components/Illustration";
import LogoDark from "LLD/features/LedgerSyncEntryPoints/assets/logo_dark.svg";
import LogoLight from "LLD/features/LedgerSyncEntryPoints/assets/logo_light.svg";
import { LedgerSyncBannerBase } from "./LedgerSyncBannerBase";

export function LedgerSyncBanner({ onPress }: Readonly<{ onPress: () => void }>) {
  return (
    <LedgerSyncBannerBase
      icon={<Illustration lightSource={LogoLight} darkSource={LogoDark} size={48} />}
      titleKey="walletSync.banner.title"
      descriptionKey="walletSync.banner.description"
      ctaKey="walletSync.banner.cta"
      onPress={onPress}
      renderButton={(ctaText, onPress) => (
        <Button variant="main" outline={false} onClick={onPress}>
          {ctaText}
        </Button>
      )}
    />
  );
}
