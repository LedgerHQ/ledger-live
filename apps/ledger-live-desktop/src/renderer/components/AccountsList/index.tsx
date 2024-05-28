import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Account } from "@ledgerhq/types-live";
import Box from "~/renderer/components/Box";
import LinkWithExternalIcon from "~/renderer/components/LinkWithExternalIcon";
import FakeLink from "~/renderer/components/FakeLink";
import { SpoilerIcon } from "~/renderer/components/Spoiler";
import { openURL } from "~/renderer/linking";
import AccountRow from "./AccountRow";
import { useSelector } from "react-redux";
import { walletSelector } from "~/renderer/reducers/wallet";
import { accountNameWithDefaultSelector } from "@ledgerhq/live-wallet/store";

export type AccountListProps = {
  accounts: Account[];
  checkedIds?: string[];
  editedNames?: {
    [accountId: string]: string;
  };
  setAccountName?: (b: Account, a: string) => void;
  onToggleAccount?: (a: Account) => void;
  onSelectAll?: (a: Account[]) => void;
  onUnselectAll?: (a: Account[]) => void;
  title?: React.ReactNode;
  emptyText?: React.ReactNode;
  autoFocusFirstInput?: boolean;
  collapsible?: boolean;
  hideAmount?: boolean;
  supportLink?: {
    id: string;
    url: string;
  };
  ToggleAllComponent?: React.ReactNode;
};

function AccountsList({
  accounts,
  checkedIds,
  editedNames = {},
  setAccountName,
  onToggleAccount,
  onSelectAll,
  onUnselectAll,
  title,
  emptyText,
  autoFocusFirstInput,
  collapsible,
  hideAmount,
  supportLink,
  ToggleAllComponent,
}: AccountListProps) {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(!!collapsible);
  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };
  const onSelectAllCb = () => {
    if (onSelectAll) onSelectAll(accounts);
  };
  const onUnselectAllCb = () => {
    if (onUnselectAll) onUnselectAll(accounts);
  };
  const walletState = useSelector(walletSelector);
  const withToggleAll = !!onSelectAll && !!onUnselectAll && accounts.length > 1;
  const isAllSelected =
    !checkedIds || accounts.every(acc => !!checkedIds.find(id => acc.id === id));
  return (
    <Box flow={3} mt={4}>
      {(title || withToggleAll) && (
        <Box horizontal alignItems="center" flow={2}>
          {title && (
            <Box
              horizontal
              ff="Inter|Bold"
              color="palette.text.shade100"
              fontSize={2}
              textTransform="uppercase"
              cursor={collapsible ? "pointer" : undefined}
              onClick={collapsible ? toggleCollapse : undefined}
            >
              {collapsible ? <SpoilerIcon isOpened={!collapsed} mr={1} /> : null}
              {title}
            </Box>
          )}
          {supportLink ? (
            <LinkWithExternalIcon
              fontSize={2}
              onClick={() => openURL(supportLink.url)}
              label={t("addAccounts.supportLinks." + supportLink.id)}
            />
          ) : null}
          {ToggleAllComponent ||
            (withToggleAll && (
              <FakeLink
                ml="auto"
                ff="Inter|Regular"
                onClick={isAllSelected ? onUnselectAllCb : onSelectAllCb}
                fontSize={3}
                style={{
                  lineHeight: "10px",
                }}
              >
                {isAllSelected
                  ? t("addAccounts.unselectAll", {
                      count: accounts.length,
                    })
                  : t("addAccounts.selectAll", {
                      count: accounts.length,
                    })}
              </FakeLink>
            ))}
        </Box>
      )}
      {collapsed ? null : accounts.length ? (
        <Box id="accounts-list-selectable" flow={2}>
          {accounts.map((account, i) => (
            <AccountRow
              key={account.id}
              account={account}
              autoFocusInput={i === 0 && autoFocusFirstInput}
              isDisabled={!onToggleAccount || !checkedIds}
              isChecked={!checkedIds || checkedIds.find(id => id === account.id) !== undefined}
              onToggleAccount={onToggleAccount}
              onEditName={setAccountName}
              hideAmount={hideAmount}
              accountName={
                typeof editedNames[account.id] === "string"
                  ? editedNames[account.id]
                  : accountNameWithDefaultSelector(walletState, account)
              }
            />
          ))}
        </Box>
      ) : emptyText ? (
        <Box ff="Inter|Regular" fontSize={3}>
          {emptyText}
        </Box>
      ) : null}
    </Box>
  );
}

export default AccountsList;
