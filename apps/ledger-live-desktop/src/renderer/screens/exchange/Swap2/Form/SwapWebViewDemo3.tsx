import { SwapLiveError } from "@ledgerhq/live-common/exchange/swap/types";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";

import { handlers as loggerHandlers } from "@ledgerhq/live-common/wallet-api/CustomLogger/server";
import { getEnv } from "@ledgerhq/live-env";

import { getNodeApi } from "@ledgerhq/coin-evm/network/node/index";
import { getMainAccount, getParentAccount } from "@ledgerhq/live-common/account/helpers";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/impl";
import { getAbandonSeedAddress } from "@ledgerhq/live-common/exchange/swap/hooks/useFromState";
import {
  convertToAtomicUnit,
  convertToNonAtomicUnit,
  getCustomFeesPerFamily,
} from "@ledgerhq/live-common/exchange/swap/webApp/utils";
import {
  accountToWalletAPIAccount,
  getAccountIdFromWalletAccountId,
} from "@ledgerhq/live-common/wallet-api/converters";
import { Account, AccountLike, TokenAccount, SwapOperation } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { useLocation } from "react-router";
import styled from "styled-components";
import { reduce, firstValueFrom } from "rxjs";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import { track } from "~/renderer/analytics/segment";
import { Web3AppWebview } from "~/renderer/components/Web3AppWebview";
import { initialWebviewState } from "~/renderer/components/Web3AppWebview/helpers";
import {
  WebviewAPI,
  WebviewProps,
  WebviewState,
  WebviewLoader,
} from "~/renderer/components/Web3AppWebview/types";
import { TopBar } from "~/renderer/components/WebPlatformPlayer/TopBar";
import { usePTXCustomHandlers } from "~/renderer/components/WebPTXPlayer/CustomHandlers";
import { context } from "~/renderer/drawers/Provider";
import { NetworkStatus, useNetworkStatus } from "~/renderer/hooks/useNetworkStatus";
import useTheme from "~/renderer/hooks/useTheme";
import logger from "~/renderer/logger";
import { flattenAccountsSelector } from "~/renderer/reducers/accounts";
import {
  counterValueCurrencySelector,
  developerModeSelector,
  enablePlatformDevToolsSelector,
  hasSeenAnalyticsOptInPromptSelector,
  languageSelector,
  lastSeenDeviceSelector,
  shareAnalyticsSelector,
} from "~/renderer/reducers/settings";
import { walletSelector } from "~/renderer/reducers/wallet";
import { captureException } from "~/sentry/renderer";
import {
  transformToBigNumbers,
  useGetSwapTrackingProperties,
  useRedirectToSwapHistory,
} from "../utils/index";
import FeesDrawerLiveApp from "./FeesDrawerLiveApp";
import WebviewErrorDrawer from "./WebviewErrorDrawer/index";
import { currentRouteNameRef } from "~/renderer/analytics/screenRefs";
import { useFeature, useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import { useDeeplinkCustomHandlers } from "~/renderer/components/WebPlatformPlayer/CustomHandlers";
import { SwapLoader } from "./SwapLoader";
import { useDiscreetMode } from "~/renderer/components/Discreet";

export class UnableToLoadSwapLiveError extends Error {
  constructor(message: string) {
    const name = "UnableToLoadSwapLiveError";
    super(message || name);
    this.name = name;
    this.message = message;
  }
}

export type SwapProps = {
  provider: string;
  fromAccountId: string;
  fromParentAccountId?: string;
  toAccountId: string;
  fromAmount: string;
  toAmount?: string;
  quoteId: string;
  rate: string;
  feeStrategy: string;
  customFeeConfig: string;
  cacheKey: string;
  loading: boolean;
  error: boolean;
  providerRedirectURL: string;
  toNewTokenId: string;
  swapApiBase: string;
  estimatedFees: string;
  estimatedFeesUnit: string;
  swapId?: string;
};

export type SwapWebProps = {
  manifest: LiveAppManifest;
  isEmbedded?: boolean;
  Loader?: WebviewLoader;
};

type TokenParams = {
  fromTokenId?: string;
  toTokenId?: string;
};

type SwapLocationState = {
  defaultAccount?: AccountLike;
  defaultParentAccount?: Account;
  defaultAccountId?: string;
  defaultParentAccountId?: string;
  defaultCurrency?: string;
  defaultAmountFrom?: string;
  from?: string;
  defaultToken?: TokenParams;
  affiliate?: string;
};

const isSwapLocationState = (value: unknown): value is SwapLocationState =>
  typeof value === "object" && value !== null;

const SwapWebAppWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  flex: 1;
`;

// remove the account id from the from path
function simplifyFromPath(path: string): string {
  return path.replace(/^\/account.*/, "/account/{id}");
}

const SWAP_API_BASE = getEnv("SWAP_API_BASE");
const SWAP_USER_IP = getEnv("SWAP_USER_IP");
const getSegWitAbandonSeedAddress = (): string => "bc1qed3mqr92zvq2s782aqkyx785u23723w02qfrgs";

const SwapWebView = ({ manifest, isEmbedded = false, Loader = SwapLoader }: SwapWebProps) => {
  const { theme } = useTheme();
  const walletState = useSelector(walletSelector);
  const dispatch = useDispatch();
  const redirectToHistory = useRedirectToSwapHistory();
  const webviewAPIRef = useRef<WebviewAPI>(null);
  const { setDrawer } = React.useContext(context);
  const [webviewState, setWebviewState] = useState<WebviewState>(initialWebviewState);
  const fiatCurrency = useSelector(counterValueCurrencySelector);
  const locale = useSelector(languageSelector);
  const lastSeenDevice = useSelector(lastSeenDeviceSelector);

  const shareAnalytics = useSelector(shareAnalyticsSelector);
  const hasSeenAnalyticsOptInPrompt = useSelector(hasSeenAnalyticsOptInPromptSelector).toString();

  const currentVersion = __APP_VERSION__;
  const enablePlatformDevTools = useSelector(enablePlatformDevToolsSelector);
  const devMode = useSelector(developerModeSelector);
  const discreetMode = useDiscreetMode();
  const accounts = useSelector(flattenAccountsSelector);
  const { t } = useTranslation();
  const swapDefaultTrack = useGetSwapTrackingProperties();
  const location = useLocation();
  const state = isSwapLocationState(location.state) ? location.state : null;
  const resolvedDefaultAccount = useMemo(() => {
    if (state?.defaultAccount) {
      return state.defaultAccount;
    }
    if (state?.defaultAccountId) {
      return accounts.find(acc => acc.id === state.defaultAccountId);
    }
    return undefined;
  }, [accounts, state?.defaultAccount, state?.defaultAccountId]);
  const resolvedDefaultParentAccount = useMemo(() => {
    if (state?.defaultParentAccount) {
      return state.defaultParentAccount;
    }
    if (state?.defaultParentAccountId) {
      const candidate = accounts.find(acc => acc.id === state.defaultParentAccountId);
      return candidate?.type === "Account" ? candidate : undefined;
    }
    if (resolvedDefaultAccount?.type === "TokenAccount") {
      const candidate = accounts.find(acc => acc.id === resolvedDefaultAccount.parentId);
      return candidate?.type === "Account" ? candidate : undefined;
    }
    return undefined;
  }, [
    accounts,
    state?.defaultParentAccount,
    state?.defaultParentAccountId,
    resolvedDefaultAccount,
  ]);
  const { networkStatus } = useNetworkStatus();
  const isOffline = networkStatus === NetworkStatus.OFFLINE;
  // Remove after KYC AB Testing
  const ptxSwapLiveAppKycWarning = useFeature("ptxSwapLiveAppKycWarning")?.enabled;
  const ptxSwapLiveAppOnPortfolio = useFeature("ptxSwapLiveAppOnPortfolio")?.enabled;
  const lldModularDrawerFF = useFeature("lldModularDrawer");
  const isLldModularDrawer = lldModularDrawerFF?.enabled && lldModularDrawerFF?.params?.live_app;
  const { isEnabled: isLwd40Enabled } = useWalletFeaturesConfig("desktop");
  const customPTXHandlers = usePTXCustomHandlers(manifest, accounts);
  const customDeeplinkHandlers = useDeeplinkCustomHandlers();
  const customHandlers = useMemo(
    () => ({
      ...loggerHandlers,
      ...customPTXHandlers,
      ...customDeeplinkHandlers,
      "custom.getFee": async ({
        params,
      }: {
        params: {
          fromAccountId: string;
          fromAmount: string;
          feeStrategy: string;
          openDrawer: boolean;
          customFeeConfig: object;
          SWAP_VERSION: string;
          gasLimit?: string;
          data?: string;
          recipient?: string;
        };
      }): Promise<{
        feesStrategy: string;
        estimatedFees: BigNumber | undefined;
        errors: object;
        warnings: object;
        customFeeConfig: object;
        gasLimit?: string;
        hasDrawer: boolean;
      }> => {
        const realFromAccountId = getAccountIdFromWalletAccountId(params.fromAccountId);
        if (!realFromAccountId) {
          return Promise.reject(new Error(`accountId ${params.fromAccountId} unknown`));
        }

        const fromAccount = accounts.find(acc => acc.id === realFromAccountId);
        if (!fromAccount) {
          return Promise.reject(new Error(`accountId ${params.fromAccountId} unknown`));
        }
        const fromParentAccount = getParentAccount(fromAccount, accounts);

        let mainAccount = getMainAccount(fromAccount, fromParentAccount);
        const bridge = getAccountBridge(fromAccount, fromParentAccount);

        const subAccountId = fromAccount.type !== "Account" && fromAccount.id;

        // NOTE: we might sync all types of accounts here
        if (mainAccount.currency.id === "bitcoin") {
          try {
            const syncedAccount = await firstValueFrom(
              bridge
                .sync(mainAccount, { paginationConfig: {} })
                .pipe(reduce((a, f: (arg0: Account) => Account) => f(a), mainAccount)),
            );
            if (syncedAccount) {
              mainAccount = syncedAccount;
            }
          } catch (e) {
            logger.error(e);
          }
        }

        const transaction = bridge.createTransaction(mainAccount);

        const preparedTransaction = await bridge.prepareTransaction(mainAccount, {
          ...transaction,
          subAccountId,
          recipient:
            params.recipient ||
            (mainAccount.currency.id === "bitcoin"
              ? getSegWitAbandonSeedAddress()
              : getAbandonSeedAddress(mainAccount.currency.id)),
          amount: convertToAtomicUnit({
            amount: new BigNumber(params.fromAmount),
            account: fromAccount,
          }),
          data: (params.data && Buffer.from(params.data.replace("0x", ""), "hex")) || undefined,
          feesStrategy: params.feeStrategy || "medium",
          customGasLimit: params.gasLimit ? new BigNumber(params.gasLimit) : null,
          ...transformToBigNumbers(params.customFeeConfig),
        });
        let status = await bridge.getTransactionStatus(mainAccount, preparedTransaction);
        const statusInit = status;
        let finalTx = preparedTransaction;
        let customFeeConfig = transaction && getCustomFeesPerFamily(finalTx);
        const setTransaction = async (newTransaction: Transaction): Promise<Transaction> => {
          status = await bridge.getTransactionStatus(mainAccount, newTransaction);
          customFeeConfig = transaction && getCustomFeesPerFamily(newTransaction);
          finalTx = newTransaction;
          return newTransaction;
        };

        const hasDrawer =
          ["evm", "bitcoin"].includes(transaction.family) &&
          !["optimism", "arbitrum", "base"].includes(mainAccount.currency.id);
        if (!params.openDrawer) {
          return {
            feesStrategy: finalTx.feesStrategy,
            estimatedFees: convertToNonAtomicUnit({
              amount: status.estimatedFees,
              account: mainAccount,
            }),
            errors: status.errors,
            warnings: status.warnings,
            customFeeConfig,
            hasDrawer,
            gasLimit: finalTx.gasLimit,
          };
        }

        return new Promise(resolve => {
          const performClose = (save: boolean) => {
            track("button_clicked2", {
              button: save ? "continueNetworkFees" : "closeNetworkFees",
              page: "quoteSwap",
              ...swapDefaultTrack,
              swapVersion: params.SWAP_VERSION,
              value: finalTx.feesStrategy || "custom",
            });
            setDrawer(undefined);
            if (!save) {
              resolve({
                feesStrategy: params.feeStrategy,
                estimatedFees: convertToNonAtomicUnit({
                  amount: statusInit.estimatedFees,
                  account: mainAccount,
                }),
                errors: statusInit.errors,
                warnings: statusInit.warnings,
                customFeeConfig: params.customFeeConfig,
                hasDrawer,
                gasLimit: finalTx.gasLimit,
              });
            }
            resolve({
              // little hack to make sure we do not return null (for bitcoin for instance)
              feesStrategy: finalTx.feesStrategy || "custom",
              estimatedFees: convertToNonAtomicUnit({
                amount: status.estimatedFees,
                account: mainAccount,
              }),
              errors: status.errors,
              warnings: status.warnings,
              customFeeConfig,
              hasDrawer,
              gasLimit: finalTx.gasLimit,
            });
          };

          setDrawer(
            FeesDrawerLiveApp,
            {
              setTransaction,
              account: fromAccount,
              parentAccount: fromParentAccount,
              status: status,
              provider: undefined,
              disableSlowStrategy: true,
              transaction: preparedTransaction,
              onRequestClose: (save: boolean) => performClose(save),
            },
            {
              title: t("swap2.form.details.label.fees"),
              forceDisableFocusTrap: true,
              onRequestClose: () => performClose(false),
            },
          );
        });
      },
      "custom.isReady": async () => {
        console.info("Swap Live App Loaded");
      },
      "custom.getTransactionByHash": async ({
        params,
      }: {
        params: {
          transactionHash: string;
          fromAccountId: string;
          SWAP_VERSION: string;
        };
      }): Promise<
        | {
            hash: string;
            blockHeight: number | undefined;
            blockHash: string | undefined;
            nonce: number;
            gasUsed: string;
            gasPrice: string;
            value: string;
          }
        | object
      > => {
        const realFromAccountId = getAccountIdFromWalletAccountId(params.fromAccountId);
        if (!realFromAccountId) {
          return Promise.reject(new Error(`accountId ${params.fromAccountId} unknown`));
        }

        const fromAccount = accounts.find(acc => acc.id === realFromAccountId);
        if (!fromAccount) {
          return Promise.reject(new Error(`accountId ${params.fromAccountId} unknown`));
        }

        const fromParentAccount = getParentAccount(fromAccount, accounts);
        const mainAccount = getMainAccount(fromAccount, fromParentAccount);

        const nodeAPI = getNodeApi(mainAccount.currency);

        try {
          const tx = await nodeAPI.getTransaction(mainAccount.currency, params.transactionHash);
          return Promise.resolve(tx);
        } catch {
          // not a real error, the node just didn't find the transaction yet
          return Promise.resolve({});
        }
      },
      "custom.swapRedirectToHistory": async () => {
        redirectToHistory();
      },
      "custom.saveSwapToHistory": async ({
        params,
      }: {
        params: { swap: SwapProps; transaction_id: string };
      }) => {
        const { swap, transaction_id } = params;

        if (
          !swap ||
          !transaction_id ||
          !swap.provider ||
          !swap.fromAmount ||
          !swap.toAmount ||
          !swap.swapId
        ) {
          return Promise.reject("Cannot save swap missing params");
        }
        const fromId = getAccountIdFromWalletAccountId(swap.fromAccountId);
        const toId = getAccountIdFromWalletAccountId(swap.toAccountId);
        if (!fromId || !toId) return Promise.reject("Accounts not found");
        const operationId = `${fromId}-${transaction_id}-OUT`;
        const fromAccount = accounts.find(acc => acc.id === fromId);
        const toAccount = accounts.find(acc => acc.id === toId);
        if (!fromAccount || !toAccount) {
          return Promise.reject(new Error(`accountId ${fromId} unknown`));
        }
        const accountId =
          fromAccount.type === "TokenAccount" ? getParentAccount(fromAccount, accounts).id : fromId;
        const swapOperation: SwapOperation = {
          status: "pending",
          provider: swap.provider,
          operationId,
          swapId: swap.swapId,
          receiverAccountId: toId,
          tokenId: toId,
          fromAmount: convertToAtomicUnit({
            amount: new BigNumber(swap.fromAmount),
            account: fromAccount,
          })!,
          toAmount: convertToAtomicUnit({
            amount: new BigNumber(swap.toAmount),
            account: toAccount,
          })!,
        };

        dispatch(
          updateAccountWithUpdater(accountId, account => {
            if (fromId === account.id) {
              return { ...account, swapHistory: [...account.swapHistory, swapOperation] };
            }
            return {
              ...account,
              subAccounts: account.subAccounts?.map<TokenAccount>((a: TokenAccount) => {
                const subAccount = {
                  ...a,
                  swapHistory: [...a.swapHistory, swapOperation],
                };
                return a.id === fromId ? subAccount : a;
              }),
            };
          }),
        );
        return Promise.resolve();
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [customPTXHandlers],
  );

  const hashString = useMemo(() => {
    const params = new URLSearchParams({
      ...(isOffline ? { isOffline: "true" } : {}),
      ...(resolvedDefaultAccount
        ? {
            toAccountId: accountToWalletAPIAccount(
              walletState,
              resolvedDefaultAccount,
              resolvedDefaultParentAccount,
            ).id,
            amountFrom: state?.defaultAmountFrom || "",
          }
        : {}),
      ...(state?.from
        ? {
            fromPath: simplifyFromPath(state?.from),
          }
        : {}),
      ...(state?.defaultToken
        ? {
            fromTokenId: state.defaultToken.fromTokenId,
            toTokenId: state.defaultToken.toTokenId,
            fromToken: state.defaultToken.fromTokenId,
            toToken: state.defaultToken.toTokenId,
            amountFrom: state?.defaultAmountFrom || "",
          }
        : {}),
      ...(state?.defaultCurrency
        ? {
            toCurrencyId: state.defaultCurrency,
          }
        : {}),
      ...(state?.affiliate
        ? {
            affiliate: state.affiliate,
          }
        : {}),
    }).toString();

    return params;
  }, [
    isOffline,
    resolvedDefaultAccount,
    resolvedDefaultParentAccount,
    state?.defaultAmountFrom,
    state?.from,
    state?.defaultToken,
    state?.defaultCurrency,
    state?.affiliate,
    walletState,
  ]);

  const onSwapWebviewError = (error?: SwapLiveError) => {
    logger.critical(error);
    setDrawer(WebviewErrorDrawer, error);
  };

  const onStateChange: WebviewProps["onStateChange"] = state => {
    setWebviewState(state);

    if (!state?.loading && state?.isAppUnavailable && !isOffline) {
      captureException(
        new UnableToLoadSwapLiveError(
          '"Failed to load swap live app using WebPlatformPlayer in SwapWeb",',
        ),
      );
    }
  };

  useEffect(() => {
    if (webviewState?.url.includes("/unknown-error")) {
      // the live app has re-directed to /unknown-error. Handle this in callback, probably wallet-api failure.
      onSwapWebviewError();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [webviewState?.url]);

  const manifestWithHash = useMemo(
    () => ({ ...manifest, url: `${manifest.url}#${hashString}` }),
    [manifest, hashString],
  );

  const initialSource = useMemo(() => {
    return currentRouteNameRef.current || "";
  }, []);

  return (
    <>
      {enablePlatformDevTools && (
        <TopBar
          manifest={manifestWithHash}
          webviewAPIRef={webviewAPIRef}
          webviewState={webviewState}
        />
      )}

      <SwapWebAppWrapper>
        <Web3AppWebview
          manifest={manifestWithHash}
          inputs={{
            source: initialSource,
            theme,
            lang: locale,
            currencyTicker: fiatCurrency.ticker,
            swapApiBase: SWAP_API_BASE,
            swapUserIp: SWAP_USER_IP,
            devMode,
            lastSeenDevice: lastSeenDevice?.modelId,
            currentVersion,
            platform: "LLD",
            shareAnalytics,
            hasSeenAnalyticsOptInPrompt,
            ptxSwapLiveAppKycWarning,
            ptxSwapLiveAppOnPortfolio: ptxSwapLiveAppOnPortfolio ? "true" : "false",
            isModularDrawer: isLldModularDrawer ? "true" : "false",
            isEmbedded: isEmbedded ? "true" : "false",
            discreetMode: discreetMode ? "true" : "false",
            lwd40enabled: isLwd40Enabled ? "true" : "false",
          }}
          onStateChange={onStateChange}
          ref={webviewAPIRef}
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          customHandlers={customHandlers as never}
          Loader={Loader}
        />
      </SwapWebAppWrapper>
    </>
  );
};

export default SwapWebView;
