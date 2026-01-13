import React from "react";
import { useTranslation } from "react-i18next";
import {
  Tile,
  Spot,
  Menu,
  MenuTrigger,
  MenuContent,
  MenuItem,
  InteractiveIcon,
} from "@ledgerhq/lumen-ui-react";
import { Wallet, Trash, MoreVertical, LedgerLogo } from "@ledgerhq/lumen-ui-react/symbols";
import { formatAddress } from "@ledgerhq/react-ui/pre-ldls/components/Address/formatAddress";
import { formatRelativeDate } from "../utils/dateFormatter";
import { useMaybeAccountName } from "~/renderer/reducers/wallet";
import { useSelector } from "LLD/hooks/redux";
import { accountsSelector } from "~/renderer/reducers/accounts";
import type { RecentAddress } from "../types";

type RecentAddressTileProps = Readonly<{
  recentAddress: RecentAddress;
  onSelect: () => void;
  onRemove: () => void;
}>;

export function RecentAddressTile({ recentAddress, onSelect, onRemove }: RecentAddressTileProps) {
  const { t } = useTranslation();
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

  const handleStopPropagation = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
  };

  return (
    <div className="w-[100px] pt-6">
      <Tile
        leadingContent={<Spot appearance="icon" icon={icon} />}
        title={displayName}
        description={dateText}
        onClick={onSelect}
        secondaryAction={
          <Menu>
            <MenuTrigger asChild>
              <InteractiveIcon
                iconType="stroked"
                aria-label="More actions"
                onClick={handleStopPropagation}
              >
                <MoreVertical />
              </InteractiveIcon>
            </MenuTrigger>
            <MenuContent>
              <MenuItem onSelect={handleRemove}>
                <Trash size={16} />
                {t("newSendFlow.remove")}
              </MenuItem>
            </MenuContent>
          </Menu>
        }
      />
    </div>
  );
}
