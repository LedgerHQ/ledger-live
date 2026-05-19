import React from "react";
import {
  NavBar,
  NavBarBackButton,
  NavBarCoinCapsule,
  NavBarTrailing,
  IconButton,
} from "@ledgerhq/lumen-ui-react";
import { MoreVertical } from "@ledgerhq/lumen-ui-react/symbols";

export type AssetHeaderProps = Readonly<{
  /** Displayed in the coin capsule next to the icon. */
  assetLabel: string;
  icon: React.ReactNode;
  onBack: () => void;
}>;

export function AssetHeader({ assetLabel, icon, onBack }: AssetHeaderProps) {
  return (
    <NavBar
      data-testid="asset-detail-header"
      className="sticky top-0 z-10 w-full min-w-0 items-center gap-4 bg-canvas"
    >
      <NavBarBackButton onClick={onBack} />
      <NavBarCoinCapsule className="min-w-0 max-w-full" ticker={assetLabel} icon={icon} />
      <NavBarTrailing>
        <IconButton appearance="gray" size="sm" icon={MoreVertical} aria-label="Action" />
      </NavBarTrailing>
    </NavBar>
  );
}
