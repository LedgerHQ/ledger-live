import React, {
  ComponentType,
  memo,
  ReactElement,
  ReactNode,
  useCallback,
  useMemo,
  useState,
} from "react";

import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";

import { AccountLike, Account } from "@ledgerhq/types-live";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";

import { Icons, QuickActionList } from "@ledgerhq/native-ui";

import { useTheme } from "styled-components/native";
import { QuickActionButtonProps } from "@ledgerhq/native-ui/components/cta/QuickAction/QuickActionButton";
import { Linking } from "react-native";
import { readOnlyModeEnabledSelector } from "../../reducers/settings";
import { accountsCountSelector } from "../../reducers/accounts";
import { NavigatorName, ScreenName } from "../../const";
import FabAccountButtonBar from "./FabAccountButtonBar";
import useAccountActions from "../../screens/Account/hooks/useAccountActions";
import useAssetActions from "./hooks/useAssetActions";
import { track } from "../../analytics";
import { useCurrentRouteName } from "../../helpers/routeHooks";

export type ModalOnDisabledClickComponentProps = {
  account?: AccountLike;
  currency?: CryptoCurrency;
  isOpen?: boolean;
  onClose: () => void;
  action: {
    label: ReactNode;
  };
};

export type ActionButtonEventProps = {
  navigationParams?: any[];
  linkUrl?: string;
  confirmModalProps?: {
    withCancel?: boolean;
    id?: string;
    title?: string | ReactElement;
    desc?: string | ReactElement;
    Icon?: ComponentType;
    children?: ReactNode;
    confirmLabel?: string | ReactElement;
    confirmProps?: any;
  };
  modalOnDisabledClick?: {
    component: React.ComponentType<ModalOnDisabledClickComponentProps>;
  };
  Component?: ComponentType;
  enableActions?: string;
};

export type ActionButton = ActionButtonEventProps & {
  label: string;
  Icon?: ComponentType<{ size: number; color: string }>;
  event: string;
  eventProperties?: { [key: string]: any };
  Component?: ComponentType;
  type?: string;
  outline?: boolean;
  disabled?: boolean;
};

type FabAccountActionsProps = {
  account: AccountLike;
  parentAccount?: Account;
};

const iconBuy = Icons.PlusMedium;
const iconSell = Icons.MinusMedium;
const iconSwap = Icons.BuyCryptoMedium;
const iconReceive = Icons.ArrowBottomMedium;
const iconSend = Icons.ArrowTopMedium;

export const FabAccountMainActionsComponent: React.FC<FabAccountActionsProps> = ({
  account,
  parentAccount,
}: FabAccountActionsProps) => {
  const [pressedDisabledAction, setPressedDisabledAction] = useState<
    ActionButton | undefined
  >(undefined);
  const [
    isDisabledActionModalOpened,
    setIsDisabledActionModalOpened,
  ] = useState(false);

  const { colors } = useTheme();
  const navigation = useNavigation();

  const { mainActions } = useAccountActions({ account, parentAccount, colors });

  const onNavigate = useCallback(
    (name: string, options?: any) => {
      const accountId = account ? account.id : undefined;
      const parentId = parentAccount ? parentAccount.id : undefined;
      navigation.navigate(name, {
        ...options,
        params: {
          ...(options ? options.params : {}),
          accountId,
          parentId,
        },
      });
    },
    [account, parentAccount, navigation],
  );

  const onPress = useCallback(
    (data: ActionButton) => {
      const { navigationParams, linkUrl } = data;
      if (linkUrl) {
        Linking.openURL(linkUrl);
      } else if (navigationParams) {
        onNavigate(...navigationParams);
      }
    },
    [onNavigate],
  );

  const onPressWhenDisabled = useCallback((action: ActionButton) => {
    setPressedDisabledAction(action);
    setIsDisabledActionModalOpened(true);
  }, []);

  const quickActions: QuickActionButtonProps[] = mainActions.map(action => ({
    Icon: action.Icon,
    children: action.label,
    onPress: () => onPress(action),
    disabled: action.disabled,
    onPressWhenDisabled: action.modalOnDisabledClick
      ? () => onPressWhenDisabled(action)
      : undefined,
  }));

  return (
    <>
      {pressedDisabledAction?.modalOnDisabledClick?.component && (
        <pressedDisabledAction.modalOnDisabledClick.component
          account={account}
          action={pressedDisabledAction}
          isOpen={isDisabledActionModalOpened}
          onClose={() => setIsDisabledActionModalOpened(false)}
        />
      )}
      <QuickActionList
        data={quickActions}
        // Use two columns only when we have only two or four items, otherwise three columns
        numColumns={
          quickActions.length === 2 || quickActions.length === 4 ? 2 : 3
        }
      />
    </>
  );
};

export const FabAccountActionsComponent: React.FC<FabAccountActionsProps> = ({
  account,
  parentAccount,
}: FabAccountActionsProps) => {
  const { colors } = useTheme();
  const { secondaryActions } = useAccountActions({
    account,
    parentAccount,
    colors,
  });

  return (
    <FabAccountButtonBar
      buttons={secondaryActions}
      account={account}
      parentAccount={parentAccount}
    />
  );
};

type Props = {
  account?: AccountLike;
  parentAccount?: Account;
  currency?: CryptoCurrency | TokenCurrency;
  accounts?: AccountLike[];
};

const FabMarketActionsComponent: React.FC<Props> = ({
  currency,
  accounts,
  ...props
}) => {
  const { mainActions } = useAssetActions({ currency, accounts });

  return <FabAccountButtonBar {...props} buttons={mainActions} />;
};

const FabAssetActionsComponent: React.FC<Props> = ({
  currency,
  accounts,
  ...props
}) => {
  const navigation = useNavigation();
  const currentScreen = useCurrentRouteName();

  const { mainActions } = useAssetActions({ currency, accounts });

  const onNavigate = useCallback(
    (name: string, options?: any) => {
      navigation.navigate(name, {
        ...options,
        params: {
          ...(options ? options.params : {}),
        },
      });
    },
    [navigation],
  );

  const onPress = useCallback(
    (data: ActionButton) => {
      track("button_clicked", {
        button: data.label,
        screen: currentScreen,
      });
      const { navigationParams, linkUrl } = data;
      if (linkUrl) {
        Linking.openURL(linkUrl);
      } else if (navigationParams) {
        onNavigate(...navigationParams);
      }
    },
    [onNavigate, currentScreen],
  );

  const quickActions: QuickActionButtonProps[] = mainActions.map(action => ({
    Icon: action.Icon,
    children: action.label,
    onPress: () => onPress(action),
    disabled: action.disabled,
  }));

  return (
    <QuickActionList
      data={quickActions}
      // Use two columns only when we have only two or four items, otherwise three columns
      numColumns={
        quickActions.length === 2 || quickActions.length === 4 ? 2 : 3
      }
    />
  );
};

type FabActionsProps = {
  areAccountsEmpty?: boolean;
};

const FabActions: React.FC<FabActionsProps> = ({
  areAccountsEmpty = false,
}) => {
  const { t } = useTranslation();
  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);
  const accountsCount: number = useSelector(accountsCountSelector);
  const hasAccounts = accountsCount > 0;

  const actions = useMemo<ActionButton[]>(() => {
    const actionButtonBuy: ActionButton = {
      event: "TransferExchange",
      label: t("exchange.buy.tabTitle"),
      Icon: iconBuy,
      navigationParams: [
        NavigatorName.Exchange,
        {
          screen: ScreenName.ExchangeBuy,
        },
      ],
    };

    const actionButtonSell: ActionButton = {
      event: "TransferExchange",
      label: t("exchange.sell.tabTitle"),
      Icon: iconSell,
      navigationParams: [
        NavigatorName.Exchange,
        {
          screen: ScreenName.ExchangeSell,
        },
      ],
    };

    const actionButtonTransferSwap: ActionButton = {
      event: "TransferSwap",
      label: t("transfer.swap.title"),
      Icon: iconSwap,
      navigationParams: [
        NavigatorName.Swap,
        {
          screen: ScreenName.Swap,
        },
      ],
    };

    const actionButtonTransferReceive: ActionButton = {
      event: "TransferReceive",
      label: t("transfer.receive.title"),
      Icon: iconReceive,
      navigationParams: [
        NavigatorName.ReceiveFunds,
        {
          screen: ScreenName.ReceiveSelectCrypto,
        },
      ],
    };

    const actionButtonTransferSend: ActionButton = {
      event: "TransferSend",
      label: t("transfer.send.title"),
      Icon: iconSend,
      navigationParams: [
        NavigatorName.SendFunds,
        {
          screen: ScreenName.SendCoin,
        },
      ],
      disabled: areAccountsEmpty,
    };

    return [
      ...(hasAccounts && !readOnlyModeEnabled
        ? [actionButtonTransferSwap]
        : []),
      actionButtonBuy,
      actionButtonSell,
      ...(hasAccounts && !readOnlyModeEnabled
        ? [actionButtonTransferReceive, actionButtonTransferSend]
        : []),
    ];
  }, [hasAccounts, readOnlyModeEnabled, t, areAccountsEmpty]);

  return <FabAccountButtonBar buttons={actions} />;
};

export const FabAccountActions = memo(FabAccountActionsComponent);

export const FabMarketActions = memo(FabMarketActionsComponent);

export const FabAssetActions = memo(FabAssetActionsComponent);

export default memo(FabActions);
