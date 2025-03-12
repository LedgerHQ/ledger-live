import { useMemo, useEffect, useRef, useCallback, useState } from "react";
import { Account, AccountLike, Operation, SignedOperation } from "@ledgerhq/types-live";
import { atom, useAtom } from "jotai";
import { AppManifest, WalletAPITransaction } from "./types";
import { getMainAccount, getParentAccount } from "../account";
import { TrackingAPI } from "./tracking";
import { getAccountBridge } from "../bridge";
import { getEnv } from "@ledgerhq/live-env";
import network from "@ledgerhq/live-network/network";
import { getWalletAPITransactionSignFlowInfos } from "./converters";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/index";
import { prepareMessageToSign } from "../hw/signMessage/index";
import { CurrentAccountHistDB, UiHook, usePermission } from "./react";
import BigNumber from "bignumber.js";
import { safeEncodeEIP55 } from "@ledgerhq/coin-evm/logic";
import { SmartWebsocket } from "./SmartWebsocket";
import { stripHexPrefix } from "./helpers";

type MessageId = number | string | null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface JsonRpcRequestMessage<TParams = any> {
  jsonrpc: "2.0";
  // Optional in the request.
  id?: MessageId;
  method: string;
  params?: TParams;
}

const rejectedError = (message: string) => ({
  code: 3,
  message,
  data: [
    {
      code: 104,
      message: "Rejected",
    },
  ],
});

// TODO remove any usage
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function convertEthToLiveTX(ethTX: any): WalletAPITransaction {
  return {
    family: "ethereum",
    amount:
      ethTX.value !== undefined
        ? new BigNumber(ethTX.value.replace("0x", ""), 16)
        : new BigNumber(0),
    recipient: safeEncodeEIP55(ethTX.to),
    gasPrice:
      ethTX.gasPrice !== undefined
        ? new BigNumber(ethTX.gasPrice.replace("0x", ""), 16)
        : undefined,
    gasLimit: ethTX.gas !== undefined ? new BigNumber(ethTX.gas.replace("0x", ""), 16) : undefined,
    data: ethTX.data ? Buffer.from(ethTX.data.replace("0x", ""), "hex") : undefined,
  };
}

export const currentAccountAtom = atom<AccountLike | null>(null);

export function useDappCurrentAccount(currentAccountHistDb?: CurrentAccountHistDB) {
  const [currentAccount, setCurrentAccount] = useAtom(currentAccountAtom);

  // prefer using this setter when the user manually sets a current account
  const setCurrentAccountHist = useCallback(
    (manifestId: string, account: AccountLike) => {
      if (!currentAccountHistDb) return;

      const [_, _setCurrentAccountHist] = currentAccountHistDb;
      _setCurrentAccountHist(state => {
        const newState = {
          ...state,
          currentAccountHist: {
            ...state.currentAccountHist,
            [manifestId]: account.id,
          },
        };
        return newState;
      });
    },
    [currentAccountHistDb],
  );

  return { currentAccount, setCurrentAccount, setCurrentAccountHist };
}

function useDappAccountLogic({
  manifest,
  accounts,
  currentAccountHistDb,
  initialAccountId,
}: {
  manifest: AppManifest;
  accounts: AccountLike[];
  currentAccountHistDb?: CurrentAccountHistDB;
  initialAccountId?: string;
}) {
  const [initialAccountSelected, setInitialAccountSelected] = useState(false);
  const { currencyIds } = usePermission(manifest);
  const { currentAccount, setCurrentAccount, setCurrentAccountHist } =
    useDappCurrentAccount(currentAccountHistDb);
  const currentParentAccount = useMemo(() => {
    if (currentAccount) {
      return getParentAccount(currentAccount, accounts);
    }
  }, [currentAccount, accounts]);

  const firstAccountAvailable = useMemo(() => {
    // Return an account for manifests with wildcard currencyIds
    if (currencyIds.includes("**") && accounts.length)
      return getParentAccount(accounts[0], accounts);

    const account = accounts.find(account => {
      if (account.type === "Account" && currencyIds.includes(account.currency.id)) {
        return account;
      }
    });
    // might not even need to set parent here
    if (account) {
      return getParentAccount(account, accounts);
    }
  }, [accounts, currencyIds]);

  const storedCurrentAccountIsPermitted = useCallback(() => {
    if (!currentAccount) return false;
    return accounts.some(
      account =>
        account.type === "Account" &&
        currencyIds.includes(account.currency.id) &&
        account.id === currentAccount.id,
    );
  }, [currentAccount, accounts, currencyIds]);

  const currentAccountIdFromHist = useMemo(() => {
    if (manifest && currentAccountHistDb) {
      return currentAccountHistDb[0]?.[manifest.id];
    }
    return null;
  }, [manifest, currentAccountHistDb]);

  const currentAccountFromHist = useMemo(() => {
    return accounts.find(account => account.id === currentAccountIdFromHist);
  }, [accounts, currentAccountIdFromHist]);

  const initialAccount = useMemo(() => {
    if (!initialAccountId) return;
    return accounts.find(account => account.id === initialAccountId);
  }, [accounts, initialAccountId]);

  useEffect(() => {
    if (initialAccountSelected) {
      return;
    }

    if (initialAccount && !initialAccountSelected) {
      setCurrentAccount(initialAccount);
      setCurrentAccountHist(manifest.id, initialAccount);
      setInitialAccountSelected(true);
      return;
    }

    if (currentAccountFromHist) {
      setCurrentAccount(currentAccountFromHist);
      return;
    }

    if (!currentAccount || !(currentAccount && storedCurrentAccountIsPermitted())) {
      // if there is no current account
      // OR if there is a current account but it is not permitted
      // set it to the first permitted account
      setCurrentAccount(firstAccountAvailable ? firstAccountAvailable : null);
    }
  }, [
    currentAccount,
    currentAccountFromHist,
    firstAccountAvailable,
    initialAccount,
    initialAccountSelected,
    manifest.id,
    setCurrentAccount,
    setCurrentAccountHist,
    storedCurrentAccountIsPermitted,
  ]);

  return {
    currentAccount,
    setCurrentAccount,
    currentParentAccount,
    setCurrentAccountHist,
  };
}

// Type guard function to make typescript happy
function isParentAccountPresent(
  account: AccountLike,
  parentAccount?: Account,
): parentAccount is Account {
  if (account.type === "TokenAccount") {
    return !!parentAccount;
  }

  return true;
}

export function useDappLogic({
  manifest,
  accounts,
  postMessage,
  uiHook,
  tracking,
  currentAccountHistDb,
  initialAccountId,
  mevProtected,
}: {
  manifest: AppManifest;
  postMessage: (message: string) => void;
  accounts: AccountLike[];
  uiHook: UiHook;
  tracking: TrackingAPI;
  currentAccountHistDb?: CurrentAccountHistDB;
  initialAccountId?: string;
  mevProtected?: boolean;
}) {
  const nanoApp = manifest.dapp?.nanoApp;
  const dependencies = manifest.dapp?.dependencies;
  const ws = useRef<SmartWebsocket>();
  const { currentAccount, currentParentAccount, setCurrentAccount, setCurrentAccountHist } =
    useDappAccountLogic({
      manifest,
      accounts,
      currentAccountHistDb,
      initialAccountId,
    });

  const currentNetwork = useMemo(() => {
    if (!currentAccount) {
      console.log(`>> No current account in useDappLogic. **`);
      return undefined;
    }
    return manifest.dapp?.networks.find(network => {
      console.log(
        `*** >> Manifest network.currency: ${network.currency} - does it match account currency?`,
        {
          currentAccountCurrency:
            currentAccount.type === "TokenAccount"
              ? currentAccount.token.id
              : currentAccount.currency.id,
          currentAccountType: currentAccount.type,
          parentAccountCurrency: currentParentAccount?.currency?.id,
          network,
        },
      );
      return (
        network.currency ===
        (currentAccount.type === "TokenAccount"
          ? currentAccount.token.id
          : currentAccount.currency.id)
      );
    });
  }, [currentAccount, manifest.dapp?.networks]);
  }, [currentAccount, currentParentAccount?.currency?.id, manifest.dapp?.networks]);

  const currentAddress = useMemo(() => {
    return currentAccount?.type === "Account"
      ? currentAccount.freshAddress
      : currentParentAccount?.freshAddress;
  }, [currentAccount, currentParentAccount?.freshAddress]);

  useEffect(() => {
    if (!currentAddress) {
      return;
    }

    postMessage(
      JSON.stringify({
        jsonrpc: "2.0",
        method: "accountsChanged",
        params: [[currentAddress]],
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAddress]);

  useEffect(() => {
    if (!currentNetwork) {
      return;
    }

    postMessage(
      JSON.stringify({
        jsonrpc: "2.0",
        method: "chainChanged",
        params: [`0x${currentNetwork.chainID.toString(16)}`],
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentNetwork?.chainID]);

  useEffect(() => {
    if (currentNetwork?.nodeURL) {
      const rpcURL = new URL(currentNetwork.nodeURL);
      if (rpcURL.protocol === "wss:") {
        const websocket = new SmartWebsocket(rpcURL.toString(), {
          reconnect: true,
          reconnectMaxAttempts: Infinity,
        });

        websocket.on("message", message => {
          postMessage(JSON.stringify(message));
        });

        websocket.connect();

        ws.current = websocket;
        return () => {
          websocket.close();
          ws.current = undefined;
        };
      }
    }
  }, [currentNetwork?.nodeURL, postMessage]);

  const onDappMessage = useCallback(
    async (data: JsonRpcRequestMessage) => {
      if (data.jsonrpc !== "2.0") {
        console.error("Request is not a jsonrpc 2.0: ", data);
        return;
      }

      if (!currentNetwork) {
        console.error("No network selected: ", data);
        postMessage(
          JSON.stringify({
            id: data.id,
            jsonrpc: "2.0",
            error: rejectedError("No network selected"),
          }),
        );
        return;
      }

      if (!currentAccount) {
        console.error("No account selected: ", data);
        postMessage(
          JSON.stringify({
            id: data.id,
            jsonrpc: "2.0",
            error: rejectedError("No account selected"),
          }),
        );
        return;
      }

      if (!isParentAccountPresent(currentAccount, currentParentAccount)) {
        console.error("No parent account found for the currentAccount: ", currentAccount, data);
        postMessage(
          JSON.stringify({
            id: data.id,
            jsonrpc: "2.0",
            error: rejectedError("No parent account found"),
          }),
        );
        return;
      }

      switch (data.method) {
        // https://eips.ethereum.org/EIPS/eip-695
        case "eth_chainId": {
          postMessage(
            JSON.stringify({
              id: data.id,
              jsonrpc: "2.0",
              result: `0x${currentNetwork.chainID.toString(16)}`,
            }),
          );
          break;
        }
        // https://eips.ethereum.org/EIPS/eip-1102
        // https://docs.metamask.io/guide/rpc-api.html#eth-requestaccounts
        case "eth_requestAccounts":
        // legacy method, cf. https://docs.metamask.io/guide/ethereum-provider.html#legacy-methods
        // eslint-disable-next-line no-fallthrough
        case "enable":
        // https://eips.ethereum.org/EIPS/eip-1474#eth_accounts
        // https://eth.wiki/json-rpc/API#eth_accounts
        // eslint-disable-next-line no-fallthrough
        case "eth_accounts": {
          const address =
            currentAccount.type === "Account"
              ? currentAccount.freshAddress
              : currentParentAccount.freshAddress;

          postMessage(
            JSON.stringify({
              id: data.id,
              jsonrpc: "2.0",
              result: [address],
            }),
          );
          break;
        }

        // https://github.com/ethereum/EIPs/blob/master/EIPS/eip-3326.md
        case "wallet_switchEthereumChain": {
          const { chainId } = data.params[0];

          // Check chanId is valid hex string
          const decimalChainId = parseInt(chainId, 16);

          if (isNaN(decimalChainId)) {
            postMessage(
              JSON.stringify({
                id: data.id,
                jsonrpc: "2.0",
                error: rejectedError("Invalid chainId"),
              }),
            );
            break;
          }

          // Check chain ID is known to the wallet
          const requestedCurrency = manifest.dapp?.networks.find(
            network => network.chainID === decimalChainId,
          );

          if (!requestedCurrency) {
            postMessage(
              JSON.stringify({
                id: data.id,
                jsonrpc: "2.0",
                error: rejectedError(`Chain ID ${chainId} is not supported`),
              }),
            );
            break;
          }

          try {
            await new Promise<void>((resolve, reject) =>
              uiHook["account.request"]({
                currencies: [getCryptoCurrencyById(requestedCurrency.currency)],
                onSuccess: account => {
                  setCurrentAccountHist(manifest.id, account);
                  setCurrentAccount(account);
                  resolve();
                },
                onCancel: () => {
                  reject("User canceled");
                },
              }),
            );
            postMessage(
              JSON.stringify({
                id: data.id,
                jsonrpc: "2.0",
                result: null,
              }),
            );
          } catch (error) {
            postMessage(
              JSON.stringify({
                id: data.id,
                jsonrpc: "2.0",
                error: rejectedError(`error switching chain: ${error}`),
              }),
            );
          }
          break;
        }

        // https://eth.wiki/json-rpc/API#eth_sendtransaction
        case "eth_sendTransaction": {
          const ethTX = data.params[0];
          const tx = convertEthToLiveTX(ethTX);
          const address =
            currentAccount.type === "Account"
              ? currentAccount.freshAddress
              : currentParentAccount.freshAddress;

          if (address.toLowerCase() === ethTX.from.toLowerCase()) {
            try {
              const options = nanoApp
                ? { hwAppId: nanoApp, dependencies: dependencies }
                : undefined;
              tracking.dappSendTransactionRequested(manifest);

              const signFlowInfos = getWalletAPITransactionSignFlowInfos({
                walletApiTransaction: tx,
                account: currentAccount,
              });

              const signedTransaction = await new Promise<SignedOperation>((resolve, reject) =>
                uiHook["transaction.sign"]({
                  account: currentAccount,
                  parentAccount: undefined,
                  signFlowInfos,
                  options,
                  onSuccess: signedOperation => {
                    resolve(signedOperation);
                  },
                  onError: error => {
                    reject(error);
                  },
                }),
              );

              const bridge = getAccountBridge(currentAccount, undefined);
              const mainAccount = getMainAccount(currentAccount, undefined);

              let optimisticOperation: Operation = signedTransaction.operation;

              if (!getEnv("DISABLE_TRANSACTION_BROADCAST")) {
                optimisticOperation = await bridge.broadcast({
                  account: mainAccount,
                  signedOperation: signedTransaction,
                  broadcastConfig: { mevProtected: !!mevProtected },
                });
              }

              uiHook["transaction.broadcast"](
                currentAccount,
                undefined,
                mainAccount,
                optimisticOperation,
              );

              tracking.dappSendTransactionSuccess(manifest);

              postMessage(
                JSON.stringify({
                  id: data.id,
                  jsonrpc: "2.0",
                  result: optimisticOperation.hash,
                }),
              );
            } catch (error) {
              tracking.dappSendTransactionFail(manifest);
              postMessage(
                JSON.stringify({
                  id: data.id,
                  jsonrpc: "2.0",
                  error: rejectedError("Transaction declined"),
                }),
              );
            }
          }
          break;
        }
        // https://github.com/ethereum/EIPs/blob/master/EIPS/eip-191.md
        // https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_sign
        // https://docs.walletconnect.com/json-rpc-api-methods/ethereum
        // Discussion about the diff between eth_sign and personal_sign:
        // https://github.com/WalletConnect/walletconnect-docs/issues/32#issuecomment-644697172
        case "personal_sign": {
          try {
            /**
             * The message is received as a prefixed hex string.
             * We need to strip the "0x" prefix.
             */
            const message = stripHexPrefix(data.params[0]);
            tracking.dappPersonalSignRequested(manifest);

            const formattedMessage = prepareMessageToSign(
              currentAccount.type === "Account" ? currentAccount : currentParentAccount,
              message,
            );

            const signedMessage = await new Promise<string>((resolve, reject) =>
              uiHook["message.sign"]({
                account: currentAccount,
                message: formattedMessage,
                onSuccess: resolve,
                onError: reject,
                onCancel: () => {
                  reject("Canceled by user");
                },
              }),
            );

            tracking.dappPersonalSignSuccess(manifest);
            postMessage(
              JSON.stringify({
                id: data.id,
                jsonrpc: "2.0",
                result: signedMessage,
              }),
            );
          } catch (error) {
            tracking.dappPersonalSignFail(manifest);
            postMessage(
              JSON.stringify({
                id: data.id,
                jsonrpc: "2.0",
                error: rejectedError("Personal message signed declined"),
              }),
            );
          }
          break;
        }

        // https://github.com/ethereum/EIPs/blob/master/EIPS/eip-712.md
        case data.method.match(/eth_signTypedData(_v.)?$/)?.input: {
          try {
            const message = data.params[1];

            tracking.dappSignTypedDataRequested(manifest);

            const formattedMessage = prepareMessageToSign(
              currentAccount.type === "Account" ? currentAccount : currentParentAccount,
              Buffer.from(message).toString("hex"),
            );

            const signedMessage = await new Promise<string>((resolve, reject) =>
              uiHook["message.sign"]({
                account: currentAccount,
                message: formattedMessage,
                onSuccess: resolve,
                onError: reject,
                onCancel: () => {
                  reject("Canceled by user");
                },
              }),
            );

            tracking.dappSignTypedDataSuccess(manifest);
            postMessage(
              JSON.stringify({
                id: data.id,
                jsonrpc: "2.0",
                result: signedMessage,
              }),
            );
          } catch (error) {
            tracking.dappSignTypedDataFail(manifest);
            postMessage(
              JSON.stringify({
                id: data.id,
                jsonrpc: "2.0",
                error: rejectedError("Typed Data message signed declined"),
              }),
            );
          }
          break;
        }

        default: {
          if (ws.current) {
            ws.current.send(data);
          } else if (currentNetwork.nodeURL?.startsWith("https:")) {
            void network({
              method: "POST",
              url: currentNetwork.nodeURL,
              data,
            }).then(res => {
              postMessage(JSON.stringify(res.data));
            });
          }
          break;
        }
      }
    },
    [
      currentAccount,
      currentNetwork,
      currentParentAccount,
      dependencies,
      manifest,
      nanoApp,
      postMessage,
      setCurrentAccount,
      setCurrentAccountHist,
      tracking,
      uiHook,
    ],
  );

  return { onDappMessage, noAccounts: !currentAccount };
}
