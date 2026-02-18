import type { RecentAddress } from "@ledgerhq/live-common/flows/send/recipient/types";
import { formatAddress } from "@ledgerhq/live-common/utils/addressUtils";
import { LedgerLogo, Wallet } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useSelector } from "~/context/hooks";
import { accountsSelector } from "~/reducers/accounts";
import { useMaybeAccountName } from "~/reducers/wallet";
import { useFormatRelativeDate } from "./useFormatRelativeDate";

export function useRecentAddressDisplay(recentAddress: RecentAddress) {
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

  const dateText = useFormatRelativeDate()(recentAddress.lastUsedAt);

  return { icon, displayName, dateText };
}
