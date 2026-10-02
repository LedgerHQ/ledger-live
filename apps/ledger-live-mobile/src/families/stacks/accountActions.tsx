import { i18n } from "~/context/Locale";
import { IconsLegacy } from "@ledgerhq/native-ui";
import type { ParamListBase, RouteProp } from "@react-navigation/native";
import type { Account } from "@ledgerhq/types-live";
import { getStacksStakingPosition } from "@ledgerhq/live-common/families/stacks/react";
import type { StacksAccount } from "@ledgerhq/live-common/families/stacks/types";
import { NavigatorName, ScreenName } from "~/const";
import type { ActionButtonEvent, NavigationParamsType } from "~/components/FabActions";
import ZeroBalanceDisabledModalContent from "~/components/FabActions/modals/ZeroBalanceDisabledModalContent";
import { getStakeLabelLocaleBased } from "~/helpers/getStakeLabelLocaleBased";

const getMainActions = ({
  account,
  parentRoute,
  canStakeUsingLedgerLive,
}: {
  account: StacksAccount;
  parentAccount?: Account;
  parentRoute?: RouteProp<ParamListBase, ScreenName>;
  canStakeUsingLedgerLive?: boolean;
}): ActionButtonEvent[] => {
  if (account.type !== "Account") return [];

  const stakingPosition = getStacksStakingPosition(account);
  // pox-5 rejects `stake` (ERR_ALREADY_STAKED) while any position exists, deactivating included.
  const isStakingLookupKnown = account.stakingPositions !== undefined;
  const canStake = isStakingLookupKnown && !stakingPosition;
  // useAccountActions only filters "stake" through stakePrograms; Unstake needs the same gate, since
  // the classic bridge can't prepare an unstake. A platform-app stake doesn't hide it: an existing
  // position must stay manageable.
  const canUnstake =
    !!canStakeUsingLedgerLive && !!stakingPosition?.actions?.includes("undelegate");
  const hasNoFunds = account.spendableBalance.lte(0);
  const params = { accountId: account.id, parentId: undefined, source: parentRoute };

  return [
    ...(canStake
      ? [
          {
            id: "stake",
            label: i18n.t(getStakeLabelLocaleBased()),
            Icon: IconsLegacy.CoinsMedium,
            event: "button_clicked",
            eventProperties: { button: "stake", currency: "STX", page: "Account Page" },
            disabled: hasNoFunds,
            ...(hasNoFunds && {
              modalOnDisabledClick: { component: ZeroBalanceDisabledModalContent },
            }),
            navigationParams: [
              NavigatorName.StacksStakingFlow,
              { screen: ScreenName.StacksStakingPool, params },
            ] satisfies NavigationParamsType,
          },
        ]
      : []),
    ...(canUnstake
      ? [
          {
            id: "unstake",
            label: i18n.t("stacks.unstake.title"),
            Icon: IconsLegacy.CoinsMedium,
            event: "button_clicked",
            eventProperties: { button: "unstake", currency: "STX", page: "Account Page" },
            navigationParams: [
              NavigatorName.StacksUnstakingFlow,
              { screen: ScreenName.StacksUnstakingSummary, params },
            ] satisfies NavigationParamsType,
          },
        ]
      : []),
  ];
};

export default {
  getMainActions,
};
