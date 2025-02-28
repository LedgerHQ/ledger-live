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
  StakeActionDefault,
  SwapActionDefault,
} from "./AccountActionsDefault";
import { useGetSwapTrackingProperties } from "~/renderer/screens/exchange/Swap2/utils/index";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { getLLDCoinFamily } from "~/renderer/families";
import { ManageAction } from "~/renderer/families/types";
import { getAvailableProviders } from "@ledgerhq/live-common/exchange/swap/index";
import { useFetchCurrencyAll } from "@ledgerhq/live-common/exchange/swap/hooks/index";
import { isWalletConnectSupported } from "@ledgerhq/live-common/walletConnect/index";
import { WC_ID } from "@ledgerhq/live-common/wallet-api/constants";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";

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

/** Overriding action -- replace family actons with actions for specific tokens  */
const STABLECOINS = ["ethereum/erc20/usd_tether__erc20_"]; //, "ethereum/erc20/usd__coin"];

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
      pathname: `/platform/${WC_ID}`,
      state: params,
    });
  }, [mainAccount.id, history]);

  const isWalletConnectActionDisplayable = isWalletConnectSupported(currency);

  return (
    <Box horizontal alignItems="center" justifyContent="flex-end" flow={2}>
      <Tooltip content={t("stars.tooltip")}>
        <Star accountId={account.id} yellow rounded />
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
            data-testid="account-settings-button"
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
  // Do we need to add getLLDTokenFamily actions here?
  console.log(
    { specific },
    "manage = specific.accountHeaderManageActions... fns",
    JSON.stringify(specific.accountHeaderManageActions),
  );

  /** When its Earn, 
   * 
    *  {
        accountActionsTestId: "stake-button",
        contrastText: "rgba(255, 255, 255, 0.6)",
        currency: {
          type: "CryptoCurrency",
          id: "ethereum",
          coinType: 60,
          name: "Ethereum",
          managerAppName: "Ethereum",
        },
        event: "button_clicked2",
        eventProperties: {
          currency: "ETH",
          currencyName: "Ethereum",
          page: "Page Account",
          button: "stake",
        },
        icon: () => {},
        key: "Stake",
        label: "Earn",
      }
   */

  const stakeProgramsFeatureFlag = useFeature("stakePrograms"); // TODO: here
  const stakeProgramsList = stakeProgramsFeatureFlag?.params?.list ?? [];
  const stakeProgramsEnabled = stakeProgramsFeatureFlag?.enabled ?? false;

  console.log({ listFlag: stakeProgramsList });

  const manage = specific?.accountHeaderManageActions;
  console.log({ manage });

  let manageList: ManageAction[] = [];
  if (manage) {
    const familyManageActions = manage({ account, parentAccount });
    manageList = familyManageActions && familyManageActions.length > 0 ? familyManageActions : [];
  }

  console.log(`>> manageList:: `, { manageList }); // this is empty for some reason. TODO: why? is it because the _family_ issue? Why do we check this twice? We could just do as the below does - if there's 3rd party staking option available, we show the button and redirect....

  const SendAction = specific?.accountActions?.SendAction || SendActionDefault;
  const ReceiveAction = specific?.accountActions?.ReceiveAction || ReceiveActionDefault;
  const currency = getAccountCurrency(account);
  const history = useHistory();

  const { isCurrencyAvailable } = useRampCatalog();

  const availableOnBuy = !!currency && isCurrencyAvailable(currency.id, "onRamp");
  const availableOnSell = !!currency && isCurrencyAvailable(currency.id, "offRamp");

  const availableOnStake = stakeProgramsEnabled && stakeProgramsList.includes(currency.id || "");

  console.log(`>>> available on stake? ${availableOnStake}...`);

  const accountCurrency = account.type === "Account" ? account.currency : account.token;

  // TODO: this is a token account specific action.
  const isTokenInvestable =
    account.type === "TokenAccount" && STABLECOINS.includes(account.token.id); //  === "ethereum/erc20/usd_tether__erc20_";

  // redirection to a third party live app list - should be exclusive with the list of native staking currencies... else we might risk duplicate buttons to stake? p
  const shouldStakeWithThirdParty = isTokenInvestable && !availableOnStake;

  // onRedirectToStake // investRedirection FIXME: We cannot redirect to all discover apps ?
  const investTokenWithThirdParty = useCallback(
    (manifestId?: string) => {
      // TODO: add tracking etc
      const value = manifestId ? `/platform/${manifestId}` : "/platform/kiln-app"; // TODO: will be kiln-widget or kiln-defi
      console.log(`>>> value is ${value}...`, `state:`, {
        accountId: account.id,
        returnTo: `/account/${account.id}`, // or earn
        currency: accountCurrency,
        // asset: "eth_0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8",
      });

      history.push({
        pathname: value,
        state: {
          accountId: account.id, // if dapp, need to use the different account id than if live app redirection
          returnTo: `/account/${account.id}`, // or earn
          currency: accountCurrency,
          chainId: "",
          // asset: "eth_0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8",
        },
      });
    },
    [history, account.id, accountCurrency],
  );

  // don't show buttons until we know whether or not we can show swap button, otherwise possible click jacking
  const showButtons = !!getAvailableProviders();
  const availableOnSwap = currenciesAll.includes(currency.id);

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
        defaultAmountFrom: "0",
        from: history.location.pathname,
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

  const familyHeaderActions: RenderActionParams[] = manageList
    // .filter(item => (availableOnStake && item.key === "Stake") || item.key !== "Stake") // TODO: this is where we filter out via the flag
    .map(item => ({
      ...item,
      contrastText,
      currency,
      eventProperties: {
        ...buttonSharedTrackingFields,
        ...item.eventProperties,
      },
    }));

  console.info(`After filter, the manageActions are..`, familyHeaderActions);

  const buyHeader = <BuyActionDefault onClick={() => onBuySell("buy")} />;
  const sellHeader = <SellActionDefault onClick={() => onBuySell("sell")} />;
  const swapHeader = <SwapActionDefault onClick={onSwap} />;
  const manageActionsHeader = familyHeaderActions.map(item => (
    <ActionItem {...item} key={item.accountActionsTestId} />
  ));

  // TODO: should be stakeWithThirdParty or stakeRedirectionHeaderAction ?
  const stakeTokenHeaderAction = (
    // <StakeActionDefault onClick={() => investTokenWithThirdParty("earn")} />
    // TODO: do we need to add the platform navigator?
    <StakeActionDefault onClick={() => investTokenWithThirdParty("stakekit")} /> //"/platform/stakekit"
  );

  const redirectToEarnHeaderAction = (
    <StakeActionDefault
      onClick={() => investTokenWithThirdParty("earn")}
      iconComponent={<>redirect</>}
    />
  );

  const NonEmptyAccountHeader = (
    <FadeInButtonsContainer data-testid="account-buttons-group" show={showButtons}>
      {familyHeaderActions.length > 0 ? manageActionsHeader : null}
      {availableOnSwap ? swapHeader : null}
      {availableOnBuy ? buyHeader : null}
      {availableOnSell && sellHeader}
      {canSend(account, parentAccount) ? (
        <SendAction account={account} parentAccount={parentAccount} onClick={onSend} />
      ) : null}
      <ReceiveAction account={account} parentAccount={parentAccount} onClick={onReceive} />
      {availableOnStake ? stakeTokenHeaderAction : null}
      {redirectToEarnHeaderAction}
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
