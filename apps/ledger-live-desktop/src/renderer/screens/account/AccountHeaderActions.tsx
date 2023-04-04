import {
  canSend,
  getAccountCurrency,
  getMainAccount,
  isAccountEmpty,
} from "@ledgerhq/live-common/account/index";
import { useRampCatalog } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/index";
import { getAllSupportedCryptoCurrencyIds } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/helpers";
import { Account, AccountLike } from "@ledgerhq/types-live";
import React, { useCallback, useMemo } from "react";
import { TFunction, Trans, withTranslation } from "react-i18next";
import { connect } from "react-redux";
import { useHistory } from "react-router-dom";
import { compose } from "redux";
import styled from "styled-components";
import { openModal } from "~/renderer/actions/modals";
import { setTrackingSource } from "~/renderer/analytics/TrackPage";
import Box, { Tabbable } from "~/renderer/components/Box";
import Star from "~/renderer/components/Stars/Star";
import Tooltip from "~/renderer/components/Tooltip";
import perFamilyAccountActions from "~/renderer/generated/accountActions";
import perFamilyManageActions from "~/renderer/generated/AccountHeaderManageActions";
import useTheme from "~/renderer/hooks/useTheme";
import IconAccountSettings from "~/renderer/icons/AccountSettings";
import IconWalletConnect from "~/renderer/icons/WalletConnect";
import { useProviders } from "~/renderer/screens/exchange/Swap2/Form";
import { rgba } from "~/renderer/styles/helpers";
import { ThemedComponent } from "~/renderer/styles/StyleProvider";
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
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
const ButtonSettings: ThemedComponent<{
  disabled?: boolean;
}> = styled(Tabbable).attrs(() => ({
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
const FadeInButtonsContainer = styled(Box).attrs(() => ({
  horizontal: true,
  flow: 2,
  alignItems: "center",
}))`
  pointer-events: ${p => !p.show && "none"};
  opacity: ${p => (p.show ? 1 : 0)};
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
      {["ethereum", "bsc", "polygon"].includes(currency.id) ? (
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
  const mainAccount = getMainAccount(account, parentAccount);
  const contrastText = useTheme("colors.palette.text.shade60");
  const swapDefaultTrack = useGetSwapTrackingProperties();

  // PTX smart routing feature flag - buy sell live app flag
  const ptxSmartRouting = useFeature("ptxSmartRouting");
  const decorators = perFamilyAccountActions[mainAccount.currency.family];
  const manage = perFamilyManageActions[mainAccount.currency.family];
  let manageList = [];
  if (manage) {
    const familyManageActions = manage({
      account,
      parentAccount,
    });
    manageList = familyManageActions && familyManageActions.length > 0 ? familyManageActions : [];
  }
  const SendAction = (decorators && decorators.SendAction) || SendActionDefault;
  const ReceiveAction = (decorators && decorators.ReceiveAction) || ReceiveActionDefault;
  const currency = getAccountCurrency(account);

  const rampCatalog = useRampCatalog();

  // eslint-disable-next-line no-unused-vars
  const [availableOnBuy, availableOnSell] = useMemo(() => {
    if (!rampCatalog.value) {
      return [false, false];
    }
    const allBuyableCryptoCurrencyIds = getAllSupportedCryptoCurrencyIds(rampCatalog.value.onRamp);
    const allSellableCryptoCurrencyIds = getAllSupportedCryptoCurrencyIds(
      rampCatalog.value.offRamp,
    );
    return [
      allBuyableCryptoCurrencyIds.includes(currency.id),
      allSellableCryptoCurrencyIds.includes(currency.id),
    ];
  }, [rampCatalog.value, currency.id]);
  const { providers, storedProviders, providersError } = useProviders();

  // don't show buttons until we know whether or not we can show swap button, otherwise possible click jacking
  const showButtons = !!(providers || storedProviders || providersError);
  const availableOnSwap =
    (providers || storedProviders) &&
    !!(providers || storedProviders).find(({ pairs }) => {
      return pairs && pairs.find(({ from, to }) => [from, to].includes(currency.id));
    });
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
      track("button_clicked", {
        button: mode,
        ...buttonSharedTrackingFields,
      });
      history.push({
        pathname: "/exchange",
        state: ptxSmartRouting?.enabled
          ? {
              currency: currency?.id,
              account: mainAccount?.id,
              mode, // buy or sell
            }
          : {
              mode: "onRamp",
              currencyId: currency.id,
              accountId: mainAccount.id,
            },
      });
    },
    [currency, history, mainAccount.id, ptxSmartRouting?.enabled, buttonSharedTrackingFields],
  );
  const onSwap = useCallback(() => {
    track("button_clicked", {
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
    track("button_clicked", {
      button: "send",
      ...buttonSharedTrackingFields,
    });
    openModal("MODAL_SEND", {
      parentAccount,
      account,
    });
  }, [openModal, parentAccount, account, buttonSharedTrackingFields]);
  const onReceive = useCallback(() => {
    track("button_clicked", {
      button: "receive",
      ...buttonSharedTrackingFields,
    });
    openModal("MODAL_RECEIVE", {
      parentAccount,
      account,
    });
  }, [openModal, parentAccount, account, buttonSharedTrackingFields]);
  const renderAction = ({
    label,
    onClick,
    event,
    eventProperties,
    icon,
    disabled,
    tooltip,
    accountActionsTestId,
  }) => {
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
  const manageActions: {
    label: any;
    onClick: () => void;
    event?: string;
    eventProperties?: object;
    icon:
      | React$ComponentType<{
          size: number;
        }>
      | ((a: { size: number }) => React$Element<any>);
    disabled?: boolean;
    tooltip?: string;
  }[] = [
    ...manageList.map(item => ({
      ...item,
      eventProperties: {
        ...buttonSharedTrackingFields,
        ...item.eventProperties,
      },
    })),
  ];
  const buyHeader = <BuyActionDefault onClick={() => onBuySell("buy")} />;
  const sellHeader = <SellActionDefault onClick={() => onBuySell("sell")} />;
  const swapHeader = <SwapActionDefault onClick={onSwap} />;
  const manageActionsHeader = manageActions.map(item => renderAction(item));
  const NonEmptyAccountHeader = (
    <FadeInButtonsContainer data-test-id="account-buttons-group" show={showButtons}>
      {manageActions.length > 0 ? manageActionsHeader : null}
      {availableOnSwap ? swapHeader : null}
      {availableOnBuy ? buyHeader : null}
      {/** don't show sell button if ptx smart routing is not enabled or sell not available */}
      {availableOnSell && ptxSmartRouting?.enabled ? sellHeader : null}
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
const ConnectedAccountHeaderActions: React$ComponentType<OwnProps> = compose(
  connect(null, mapDispatchToProps),
  withTranslation(),
)(AccountHeaderActions);
export const AccountHeaderSettingsButton: React$ComponentType<OwnProps> = compose(
  connect(null, mapDispatchToProps),
  withTranslation(),
)(AccountHeaderSettingsButtonComponent);
export default ConnectedAccountHeaderActions;
