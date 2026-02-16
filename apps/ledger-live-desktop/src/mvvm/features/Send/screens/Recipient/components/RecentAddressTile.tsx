import type { RecentAddress } from "@ledgerhq/live-common/flows/send/recipient/types";
import { formatAddress } from "@ledgerhq/live-common/utils/addressUtils";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
  Tile,
  TileContent,
  TileDescription,
  TileSecondaryAction,
  TileSpot,
  TileTitle,
} from "@ledgerhq/lumen-ui-react";
import { LedgerLogo, MoreVertical, Trash, Wallet } from "@ledgerhq/lumen-ui-react/symbols";
import { useSelector } from "LLD/hooks/redux";
import React from "react";
import { useTranslation } from "react-i18next";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { useMaybeAccountName } from "~/renderer/reducers/wallet";
import { useFormatRelativeDate } from "../hooks/useFormatRelativeDate";

type RecentAddressTileProps = Readonly<{
  recentAddress: RecentAddress;
  onSelect: () => void;
  onRemove: () => void;
}>;

export function RecentAddressTile({ recentAddress, onSelect, onRemove }: RecentAddressTileProps) {
  const { t } = useTranslation();
  const formatRelativeDate = useFormatRelativeDate();
  const allAccounts = useSelector(accountsSelector);

  const account = recentAddress.accountId
    ? allAccounts.find(acc => acc.id === recentAddress.accountId)
    : undefined;

  const accountName = useMaybeAccountName(account);

  const icon = recentAddress.isLedgerAccount ? LedgerLogo : Wallet;

  const displayName =
    recentAddress.ensName ??
    (recentAddress.isLedgerAccount && accountName
      ? accountName
      : recentAddress.name ??
        formatAddress(recentAddress.address, { prefixLength: 5, suffixLength: 4 }));

  const dateText = formatRelativeDate(recentAddress.lastUsedAt);

  const handleRemove = () => {
    onRemove();
  };

  return (
    <div className="w-96 pt-6">
      <Tile
        onClick={onSelect}
        secondaryAction={
          <Menu>
            <MenuTrigger asChild>
              <TileSecondaryAction icon={MoreVertical} aria-label="More actions" />
            </MenuTrigger>
            <MenuContent>
              <MenuItem onSelect={handleRemove}>
                <Trash size={16} />
                {t("newSendFlow.remove")}
              </MenuItem>
            </MenuContent>
          </Menu>
        }
      >
        <TileSpot appearance="icon" icon={icon} />
        <TileContent>
          <TileTitle>{displayName}</TileTitle>
          <TileDescription>{dateText}</TileDescription>
        </TileContent>
      </Tile>
    </div>
  );
}
