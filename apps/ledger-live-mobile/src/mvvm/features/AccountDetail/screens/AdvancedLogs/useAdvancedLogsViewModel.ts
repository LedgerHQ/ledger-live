import { useMemo } from "react";
import { useRoute, type RouteProp } from "@react-navigation/native";
import type { Account } from "@ledgerhq/types-live";
import { getTagDerivationMode } from "@ledgerhq/ledger-wallet-framework/derivation";
import type { AdvancedLogsInput } from "@features/flow-account-detail-settings";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";
import { useSelector } from "~/context/hooks";
import { localeSelector } from "~/reducers/settings";
import type { ScreenName } from "~/const";
import type { AccountDetailNavigatorParamsList } from "../../types";

type AdvancedLogsRoute = RouteProp<
  AccountDetailNavigatorParamsList,
  ScreenName.AccountDetailAdvancedLogs
>;

export type AdvancedLogsViewModel = Readonly<{
  input: AdvancedLogsInput | undefined;
  locale: string;
  derivationTag: string | undefined;
}>;

function getDerivationTag(account: Account): string | undefined {
  if (account.derivationMode === undefined || account.derivationMode === null) return undefined;
  return getTagDerivationMode(account.currency, account.derivationMode) ?? undefined;
}

export function useAdvancedLogsViewModel(): AdvancedLogsViewModel {
  const route = useRoute<AdvancedLogsRoute>();
  const { account } = useAccountScreen(route);
  const mainAccount = account?.type === "Account" ? account : undefined;
  const locale = useSelector(localeSelector);

  const input = useMemo<AdvancedLogsInput | undefined>(
    () =>
      mainAccount && {
        xpub: mainAccount.xpub,
        index: mainAccount.index,
        freshAddressPath: mainAccount.freshAddressPath,
        id: mainAccount.id,
        blockHeight: mainAccount.blockHeight,
        lastSyncDate: mainAccount.lastSyncDate,
      },
    [mainAccount],
  );

  const derivationTag = useMemo(
    () => (mainAccount ? getDerivationTag(mainAccount) : undefined),
    [mainAccount],
  );

  return { input, locale, derivationTag };
}
