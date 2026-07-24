import { i18n } from "~/context/Locale";
import { IconsLegacy } from "@ledgerhq/native-ui";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { CryptoCurrency, TokenCurrency } from "@domain/entity-currency";
import type { AleoAccount } from "@ledgerhq/live-common/families/aleo/types";
import { NavigatorName, ScreenName } from "~/const";
import type { ActionButtonEvent } from "~/components/FabActions";
import ZeroBalanceDisabledModalContent from "~/components/FabActions/modals/ZeroBalanceDisabledModalContent";

const getMainActions = ({
  account,
  parentAccount,
}: {
  account: AleoAccount;
  parentAccount?: Account;
}): ActionButtonEvent[] => [
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
    ],
  },
];

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
  ],
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
    ],
  },
];

export default {
  getMainActions,
  getExtraSendActionParams,
  getAdditionalAssetActions,
};
