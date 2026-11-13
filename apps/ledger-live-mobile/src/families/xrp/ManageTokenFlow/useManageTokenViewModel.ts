import { useCallback, useMemo } from "react";
import invariant from "invariant";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { getMaxTrustLimitForToken } from "@ledgerhq/live-common/families/xrp/logicPublic";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { useTranslation } from "~/context/Locale";
import { getManagedTokenAccounts, getXrpResources } from "../utils";
import type { XrpManageTokenFlowParamList } from "./types";

export type Props = BaseComposite<
  StackNavigatorProps<XrpManageTokenFlowParamList, ScreenName.XrpManageTokenManage>
>;

export function useManageTokenViewModel({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { account } = useAccountScreen(route);
  invariant(account?.type === "Account", "xrp: account required");

  const accountId = account.id;
  const maxLimit = getMaxTrustLimitForToken();

  const onEdit = useCallback(
    (tokenAccountId: string) => {
      navigation.navigate(ScreenName.XrpManageTokenSettings, {
        accountId: tokenAccountId,
        parentId: accountId,
      });
    },
    [accountId, navigation],
  );

  const assets = useMemo(() => {
    return getManagedTokenAccounts(account).map(tokenAccount => {
      const { token } = tokenAccount;
      const resources = getXrpResources(tokenAccount);
      const isIou = token.tokenType === "iou";
      const limit = resources?.limit;
      const limitText = limit?.eq(maxLimit)
        ? t("xrp.tokenSettings.maximum")
        : limit && formatCurrencyUnit(token.units[0], limit, { showCode: true });

      return {
        token,
        isIou,
        limitText,
        id: tokenAccount.id,
        ripplingText: t(
          resources?.isRippling ? "xrp.rippling.activated" : "xrp.rippling.deactivated",
        ),
      };
    });
  }, [account, maxLimit, t]);

  return { assets, onEdit };
}
