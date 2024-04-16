import {
  canSend,
  getAccountCurrency,
  getMainAccount,
  isAccountEmpty,
} from "@ledgerhq/live-common/account/index";
import { useRampCatalog } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog";

import { Account, AccountLike } from "@ledgerhq/types-live";
import React, { useCallback, useMemo } from "react";
import { TFunction } from "i18next";
import { withTranslation } from "react-i18next";
import { connect } from "react-redux";
import { useHistory } from "react-router-dom";
import { compose } from "redux";
import styled from "styled-components";
import { openModal } from "~/renderer/actions/modals";
import { setTrackingSource } from "~/renderer/analytics/TrackPage";
import Box, { Tabbable } from "~/renderer/components/Box";
import Star from "~/renderer/components/Stars/Star";
import Tooltip from "~/renderer/components/Tooltip";
import useTheme from "~/renderer/hooks/useTheme";
import IconAccountSettings from "~/renderer/icons/AccountSettings";
import IconWalletConnect from "~/renderer/icons/WalletConnect";
import { rgba } from "~/renderer/styles/helpers";
import { track } from "~/renderer/analytics/segment";
import {
  ActionDefault,
  BuyActionDefault,
  ReceiveActionDefault,
  SellActionDefault,
  SendActionDefault,
  SwapActionDefault,
} from "./AccountActionsDefault";
import { useGetSwapTrackingProperties } from "~/renderer/screens/exchange/Swap2/utils/index";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { getLLDCoinFamily } from "~/renderer/families";
import { ManageAction } from "~/renderer/families/types";
import { getAvailableProviders } from "@ledgerhq/live-common/exchange/swap/index";
import { useFetchCurrencyAll } from "@ledgerhq/live-common/exchange/swap/hooks/index";
import { isWalletConnectSupported } from "@ledgerhq/live-common/walletConnect/index";

type RenderActionParams = {
  label: React.ReactNode;
  onClick: () => void;
  event?: string;
  eventProperties?: Record<string, unknown>;
  icon:
    | React.ComponentType<{
        size: number;
        overrideColor: string;
        currency: TokenCurrency | CryptoCurrency;
      }>
    | ((a: { size: number }) => React.ReactElement);
  disabled?: boolean;
  tooltip?: string;
  accountActionsTestId?: string;
  contrastText: string;
  currency: TokenCurrency | CryptoCurrency;
};

const ButtonSettings = styled(Tabbable).attrs<{ disabled?: boolean }>(() => ({
  alignItems: "center",
  justifyContent: "center",
}))`
  width: 40px;
  height: 40px;
  border: 1px solid ${p => p.theme.colors.palette.text.shade60};
  border-radius: 20px;
  &:hover {
    color: ${p => (p.disabled ? "" : p.theme.colors.palette.text.shade100)};
    background: ${p => (p.disabled ? "" : rgba(p.theme.colors.palette.divider, 0.2))};
    border-color: ${p => p.theme.colors.palette.text.shade100};
  }

  &:active {
    background: ${p => (p.disabled ? "" : rgba(p.theme.colors.palette.divider, 0.3))};
  }
`;

const FadeInButtonsContainer = styled(Box).attrs<{ show?: boolean }>({
  horizontal: true,
  flow: 2,
  alignItems: "center",
})<{ show?: boolean }>`
  transition: opacity 400ms ease-in;
`;
const mapDispatchToProps = {
  openModal,
};
type OwnProps = {
  account: AccountLike;
  parentAccount?: Account;
};
type Props = {
  t: TFunction;
  openModal: Function;
} & OwnProps;

const ActionItem = ({
  label,
  onClick,
  event,
  eventProperties,
  icon,
  disabled,
  tooltip,
  accountActionsTestId,
  contrastText,
  currency,
}: RenderActionParams) => {
  const Icon = icon;
  const Action = (
    <ActionDefault
      disabled={disabled}
      onClick={onClick}
      event={event}
      eventProperties={eventProperties}
      iconComponent={Icon && <Icon size={14} overrideColor={contrastText} currency={currency} />}
      labelComponent={label}
      accountActionsTestId={accountActionsTestId}
    />
  );
  if (tooltip) {
    return <Tooltip content={tooltip}>{Action}</Tooltip>;
  }
  return Action;
};

const AccountHeaderSettingsButtonComponent = ({ account, parentAccount, openModal, t }: Props) => {
  const mainAccount = getMainAccount(account, parentAccount);
  const currency = getAccountCurrency(account);
  const history = useHistory();
  const onWalletConnectLiveApp = useCallback(() => {
    setTrackingSource("account header actions");
    const params = {
      initialAccountId: mainAccount.id,
    };
    history.push({
      pathname: "/platform/ledger-wallet-connect",
      state: params,
    });
  }, [mainAccount.id, history]);

  const isWalletConnectActionDisplayable = isWalletConnectSupported(currency);

  return (
    <Box horizontal alignItems="center" justifyContent="flex-end" flow={2}>
      <Tooltip content={t("stars.tooltip")}>
        <Star
          accountId={account.id}
          parentId={account.type !== "Account" ? account.parentId : undefined}
          yellow
          rounded
        />
      </Tooltip>
      {isWalletConnectActionDisplayable ? (
        <Tooltip content={t("walletconnect.titleAccount")}>
          <ButtonSettings onClick={onWalletConnectLiveApp}>
            <Box justifyContent="center">
              <IconWalletConnect size={14} />
            </Box>
          </ButtonSettings>
        </Tooltip>
      ) : null}
      {account.type === "Account" ? (
        <Tooltip content={t("account.settings.title")}>
          <ButtonSettings
            data-test-id="account-settings-button"
            onClick={() =>
              openModal("MODAL_SETTINGS_ACCOUNT", {
                parentAccount,
                account,
              })
            }
          >
            <Box justifyContent="center">
              <IconAccountSettings size={14} />
            </Box>
          </ButtonSettings>
        </Tooltip>
      ) : null}
    </Box>
  );
};

const pageName = "Page Account";

const AccountHeaderActions = ({ account, parentAccount, openModal }: Props) => {
  const { data: currenciesAll } = useFetchCurrencyAll();
  const mainAccount = getMainAccount(account, parentAccount);
  const contrastText = useTheme().colors.palette.text.shade60;
  const swapDefaultTrack = useGetSwapTrackingProperties();
  const specific = getLLDCoinFamily(mainAccount.currency.family);

  const manage = specific?.accountHeaderManageActions;
  let manageList: ManageAction[] = [];
  if (manage) {
    const familyManageActions = manage({ account, parentAccount });
    manageList = familyManageActions && familyManageActions.length > 0 ? familyManageActions : [];
  }

  const SendAction = specific?.accountActions?.SendAction || SendActionDefault;
  const ReceiveAction = specific?.accountActions?.ReceiveAction || ReceiveActionDefault;
  const currency = getAccountCurrency(account);

  const { isCurrencyAvailable } = useRampCatalog();

  const availableOnBuy = !!currency && isCurrencyAvailable(currency.id, "onRamp");
  const availableOnSell = !!currency && isCurrencyAvailable(currency.id, "offRamp");

  // don't show buttons until we know whether or not we can show swap button, otherwise possible click jacking
  const showButtons = !!getAvailableProviders();
  const availableOnSwap = currenciesAll.includes(currency.id);

  const history = useHistory();
  const buttonSharedTrackingFields = useMemo(
    () => ({
      currency: currency.ticker,
      currencyName: currency.name,
      page: pageName,
    }),
    [currency],
  );

  const onBuySell = useCallback(
    (mode = "buy") => {
      setTrackingSource("account header actions");
      track("button_clicked2", {
        button: mode,
        ...buttonSharedTrackingFields,
      });
      history.push({
        pathname: "/exchange",
        state: {
          currency: currency?.id,
          account: mainAccount?.id,
          mode, // buy or sell
        },
      });
    },
    [currency, history, mainAccount.id, buttonSharedTrackingFields],
  );

  const onSwap = useCallback(() => {
    track("button_clicked2", {
      button: "swap",
      ...buttonSharedTrackingFields,
      ...swapDefaultTrack,
    });
    setTrackingSource(pageName);
    history.push({
      pathname: "/swap",
      state: {
        defaultCurrency: currency,
        defaultAccount: account,
        defaultParentAccount: parentAccount,
      },
    });
  }, [currency, swapDefaultTrack, history, account, parentAccount, buttonSharedTrackingFields]);

  const onSend = useCallback(() => {
    track("button_clicked2", {
      button: "send",
      ...buttonSharedTrackingFields,
    });
    openModal("MODAL_SEND", {
      parentAccount,
      account,
    });
  }, [openModal, parentAccount, account, buttonSharedTrackingFields]);

  const onReceive = useCallback(() => {
    track("button_clicked2", {
      button: "receive",
      ...buttonSharedTrackingFields,
    });
    openModal("MODAL_RECEIVE", {
      parentAccount,
      account,
    });
  }, [openModal, parentAccount, account, buttonSharedTrackingFields]);

  const manageActions: RenderActionParams[] = [
    ...manageList.map(item => ({
      ...item,
      contrastText,
      currency,
      eventProperties: {
        ...buttonSharedTrackingFields,
        ...item.eventProperties,
      },
    })),
  ];

  const buyHeader = <BuyActionDefault onClick={() => onBuySell("buy")} />;
  const sellHeader = <SellActionDefault onClick={() => onBuySell("sell")} />;
  const swapHeader = <SwapActionDefault onClick={onSwap} />;
  const manageActionsHeader = manageActions.map(item => (
    <ActionItem {...item} key={item.accountActionsTestId} />
  ));

  const NonEmptyAccountHeader = (
    <FadeInButtonsContainer data-test-id="account-buttons-group" show={showButtons}>
      {manageActions.length > 0 ? manageActionsHeader : null}
      {availableOnSwap ? swapHeader : null}
      {availableOnBuy ? buyHeader : null}
      {availableOnSell && sellHeader}
      {canSend(account, parentAccount) ? (
        <SendAction account={account} parentAccount={parentAccount} onClick={onSend} />
      ) : null}
      <ReceiveAction account={account} parentAccount={parentAccount} onClick={onReceive} />
    </FadeInButtonsContainer>
  );

  return (
    <Box horizontal alignItems="center" justifyContent="flex-end" flow={2} mt={15}>
      {!isAccountEmpty(account) ? NonEmptyAccountHeader : null}
    </Box>
  );
};
const ConnectedAccountHeaderActions = compose<React.ComponentType<OwnProps>>(
  connect(null, mapDispatchToProps),
  withTranslation(),
)(AccountHeaderActions);

export const AccountHeaderSettingsButton = compose<React.ComponentType<OwnProps>>(
  connect(null, mapDispatchToProps),
  withTranslation(),
)(AccountHeaderSettingsButtonComponent);

export default ConnectedAccountHeaderActions;
