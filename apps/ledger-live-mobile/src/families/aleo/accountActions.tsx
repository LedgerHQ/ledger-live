import React from "react";
import { i18n, Trans } from "~/context/Locale";
import { IconsLegacy } from "@ledgerhq/native-ui";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { AleoAccount } from "@ledgerhq/live-common/families/aleo/types";
import { getAleoCurrencyConfigById } from "@ledgerhq/live-common/families/aleo/config";
import { NavigatorName, ScreenName } from "~/const";
import type { ActionButtonEvent, NavigationParamsType } from "~/components/FabActions";
import ZeroBalanceDisabledModalContent from "~/components/FabActions/modals/ZeroBalanceDisabledModalContent";
import { getStakeLabelLocaleBased } from "~/helpers/getStakeLabelLocaleBased";

const getMainActions = ({
  account,
  parentAccount,
}: {
  account: AleoAccount;
  parentAccount?: Account;
}): ActionButtonEvent[] => {
  const transparentBalance = account.aleoResources?.transparentBalance;
  const hasNoPublicFunds = !transparentBalance || transparentBalance.isZero();
  const config = getAleoCurrencyConfigById(account.currency.id);
  const stakeLabel = getStakeLabelLocaleBased();
  const isStakingEnabled = !!config?.enableStaking;

  return [
    ...(isStakingEnabled
      ? [
          {
            id: "stake",
            label: <Trans i18nKey={stakeLabel} />,
            Icon: IconsLegacy.CoinsMedium,
            event: "button_clicked",
            eventProperties: { button: "stake", currency: "ALEO", page: "Account Page" },
            disabled: hasNoPublicFunds,
            modalOnDisabledClick: { component: ZeroBalanceDisabledModalContent },
            navigationParams: [
              NavigatorName.AleoBondPublicFlow,
              {
                screen: ScreenName.AleoBondPublicSelectValidator,
                params: { accountId: account.id, parentId: parentAccount?.id },
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
