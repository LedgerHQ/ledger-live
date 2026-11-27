import { handlers as operationDetailsHandlers } from "@features/platform-wallet-api-operation-details";
import type { WalletAPICustomHandlers } from "@ledgerhq/live-common/wallet-api/types";
import type { AccountLike } from "@ledgerhq/types-live";
import { useNavigation } from "@react-navigation/native";
import { useMemo } from "react";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type { StackNavigatorNavigation } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { findOperationDetailsTarget } from "../utils/findOperationDetailsTarget";

export function useOperationDetailsHandlers(accounts: AccountLike[]) {
  const navigation = useNavigation<StackNavigatorNavigation<BaseNavigatorStackParamList>>();

  return useMemo<WalletAPICustomHandlers>(
    () =>
      operationDetailsHandlers({
        uiHooks: {
          "operationDetails.open": request =>
            navigation.navigate(
              ScreenName.OperationDetails,
              findOperationDetailsTarget(accounts, request),
            ),
        },
      }),
    [accounts, navigation],
  );
}
