import { i18n } from "~/context/Locale";
import { IconsLegacy } from "@ledgerhq/native-ui";
import type { ParamListBase, RouteProp } from "@react-navigation/native";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { AleoAccount } from "@ledgerhq/live-common/families/aleo/types";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { getAleoCurrencyConfigById } from "@ledgerhq/live-common/families/aleo/config";
import { hasPendingOperationType } from "@ledgerhq/live-common/families/aleo/utils";
import { NavigatorName, ScreenName } from "~/const";
import type { ActionButtonEvent, NavigationParamsType } from "~/components/FabActions";
import ZeroBalanceDisabledModalContent from "~/components/FabActions/modals/ZeroBalanceDisabledModalContent";
import { getStakeLabelLocaleBased } from "~/helpers/getStakeLabelLocaleBased";

const getMainActions = ({
  account,
  parentAccount,
  parentRoute,
}: {
  account: AleoAccount;
  parentAccount?: Account;
  parentRoute?: RouteProp<ParamListBase, ScreenName>;
}): ActionButtonEvent[] => {
  const mainAccount = getMainAccount<AleoAccount>(account, parentAccount);
  const transparentBalance = mainAccount.aleoResources?.transparentBalance;
  const hasNoPublicFunds = !transparentBalance || transparentBalance.isZero();
  const hasPendingBond = hasPendingOperationType(mainAccount, "BOND");
  const config = getAleoCurrencyConfigById(mainAccount.currency.id);
  const stakeLabel = getStakeLabelLocaleBased();
  const showStakingAction = !!config?.enableStaking && account.type === "Account";

  return [
    ...(showStakingAction
      ? [
          {
            id: "stake",
            label: i18n.t(stakeLabel),
            Icon: IconsLegacy.CoinsMedium,
            event: "button_clicked",
            eventProperties: { button: "stake", currency: "ALEO", page: "Account Page" },
            disabled: hasNoPublicFunds || hasPendingBond,
            ...(hasNoPublicFunds && {
              modalOnDisabledClick: { component: ZeroBalanceDisabledModalContent },
            }),
            navigationParams: [
              NavigatorName.AleoBondPublicFlow,
              {
                screen: ScreenName.AleoBondPublicSelectValidator,
                params: { accountId: mainAccount.id, parentId: undefined, source: parentRoute },
              },
            ] satisfies NavigationParamsType,
          },
        ]
      : []),
    {
      id: "public_to_private",
      label: i18n.t("aleo.accountActions.publicToPrivate"),
      Icon: IconsLegacy.TransferMedium,
      event: "button_clicked",
      eventProperties: {
        button: "public_to_private",
        currency: "ALEO",
        page: "Account Page",
      },
      disabled: !account.balance.gt(0),
      modalOnDisabledClick: {
        component: ZeroBalanceDisabledModalContent,
      },
      navigationParams: [
        NavigatorName.SendFunds,
        {
          screen: ScreenName.AleoSendBalanceSelection,
          params: { account, parentAccount, isSelfTransfer: true },
        },
      ] satisfies NavigationParamsType,
    },
  ];
};

const getExtraSendActionParams = ({
  account,
  parentAccount,
}: {
  account: AccountLike;
  parentAccount?: Account;
}) => ({
  navigationParams: [
    NavigatorName.SendFunds,
    {
      screen: ScreenName.AleoSendBalanceSelection,
      params: { account, parentAccount: parentAccount ?? undefined, isSelfTransfer: false },
    },
  ] satisfies NavigationParamsType,
});

const getAdditionalAssetActions = ({
  currency,
  defaultAccount,
  parentAccount,
}: {
  currency: CryptoCurrency | TokenCurrency | undefined;
  defaultAccount: AccountLike | undefined;
  parentAccount: Account | undefined;
}): ActionButtonEvent[] => [
  {
    id: "self_transfer",
    label: i18n.t("aleo.accountActions.publicToPrivate"),
    Icon: IconsLegacy.TransferMedium,
    event: "button_clicked",
    eventProperties: { button: "self_transfer", currency: currency?.ticker },
    ...(defaultAccount && { disabled: !defaultAccount.balance.gt(0) }),
    modalOnDisabledClick: {
      component: ZeroBalanceDisabledModalContent,
    },
    navigationParams: [
      NavigatorName.SendFunds,
      defaultAccount
        ? {
            screen: ScreenName.AleoSendBalanceSelection,
            params: {
              account: defaultAccount,
              parentAccount,
              isSelfTransfer: true,
            },
          }
        : {
            screen: ScreenName.SendCoin,
            params: {
              selectedCurrency: currency,
              extra: { isSelfTransfer: true },
            },
          },
    ] satisfies NavigationParamsType,
  },
];

export default {
  getMainActions,
  getExtraSendActionParams,
  getAdditionalAssetActions,
};
