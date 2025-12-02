import React from "react";
import { Tile, Spot, InteractiveIcon } from "@ledgerhq/ldls-ui-react";
import { Wallet, Trash } from "@ledgerhq/ldls-ui-react/symbols";
import { formatAddress } from "@ledgerhq/react-ui/pre-ldls/components/Address/formatAddress";
import { formatRelativeDate } from "../utils/dateFormatter";
import type { RecentAddress } from "../../../types";

type RecentAddressTileProps = {
  recentAddress: RecentAddress;
  onSelect: () => void;
  onRemove: () => void;
};

export function RecentAddressTile({ recentAddress, onSelect, onRemove }: RecentAddressTileProps) {
  const displayName =
    recentAddress.name ??
    formatAddress(recentAddress.address, { prefixLength: 5, suffixLength: 4 });
  const dateText = formatRelativeDate(recentAddress.lastUsedAt);

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove();
  };

  return (
    <div className="shrink-0 pt-6">
      <Tile
        leadingContent={<Spot appearance="icon" icon={Wallet} />}
        title={displayName}
        description={dateText}
        onClick={onSelect}
        secondaryAction={
          <InteractiveIcon iconType="stroked" onClick={handleRemove} aria-label="Remove address">
            <Trash size={20} />
          </InteractiveIcon>
        }
      />
    </div>
  );
}
