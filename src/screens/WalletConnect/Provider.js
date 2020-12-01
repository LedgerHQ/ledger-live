/* @flow */
import React, { useEffect, useState, useReducer } from "react";
import WalletConnect from "@walletconnect/client";
import { useSelector } from "react-redux";
import { parseCallRequest } from "@ledgerhq/live-common/lib/walletconnect";
import type { AccountLike } from "@ledgerhq/live-common/lib/types";
import { saveWCSession, getWCSession } from "../../db";
import { accountScreenSelector } from "../../reducers/accounts";
import { NavigatorName, ScreenName } from "../../const";
import { navigate, navigationRef } from "../../rootnavigation";

export const STATUS = {
  DISCONNECTED: 0x00,
  CONNECTING: 0x01,
  ERROR: 0x02,
  CONNECTED: 0x03,
};

const clientMeta = {
  description: "LedgerLive",
  url: "https://ledger.fr",
  icons: [
    "https://play-lh.googleusercontent.com/RVKjd96rcTjiAnr45Gy6Nj2kCJ4_opdU2mrop7KftfyRhPWJf5ukvUR_Gi9AtOA920I",
  ],
  name: "LedgerLive",
};

type State = {
  status: number,
  initDone: boolean,
  session: { accountId?: string, session?: { peerMeta: any } },
  socketReady: boolean,
  connector: any,

  error: any | null,
  currentCallRequestId: string | null,
  dappInfo: any | null,
};

// actions
// it makes them available and current from connector events handlers
export let connect: (uri?: string) => void = () => {};
export let disconnect: Function = () => {};
export let approveSession: (account: AccountLike) => void = () => {};
export let setCurrentCallRequestResult: Function = () => {};
export let setCurrentCallRequestError: Function = () => {};
export let handleCallRequest: (payload: any) => Promise = () => {};

// reducer
const reducer = (state: State, update) => {
  return {
    ...state,
    ...update,
    session:
      update.session === null
        ? {}
        : {
            ...state.session,
            ...(update.session || {}),
          },
  };
};
const initialState = {
  session: {},
  socketReady: false,
  connector: null,
  status: STATUS.DISCONNECTED,
  error: null,
  initDone: false,
  currentCallRequestId: null,
  dappInfo: null,
};

export const context = React.createContext<State>(initialState);

const ProviderCommon = ({
  children,
  useAccount,
  onMessage,
  onSessionRestarted,
  onRemoteDisconnected,
  isReady,
  saveWCSession,
  getWCSession,
}: {
  children: React$Node,
  useAccount: Function,
  onMessage: Function,
  onSessionRestarted: Function,
  onRemoteDisconnected: Function,
  isReady: boolean,
  saveWCSession: Function,
  getWCSession: Function,
}) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const account = useAccount(state.session.accountId);

  // actions

  connect = uri => {
    let connector;

    try {
      connector = new WalletConnect(
        state.session.session
          ? { session: state.session.session }
          : { uri, clientMeta },
      );
    } catch (e) {
      dispatch({
        status: STATUS.ERROR,
        error: e,
      });
      return;
    }

    // handlers
    // THEY DO NOT HAVE ACCESS TO THE STATE
    connector.on("session_request", (error, payload) => {
      if (error) {
        dispatch({
          status: STATUS.ERROR,
          error,
        });
        return;
      }

      dispatch({
        dappInfo: payload.params[0].peerMeta,
      });
    });

    connector.on("connect", () => {
      dispatch({
        session: {
          session: connector.session,
        },
        status: STATUS.CONNECTED,
      });
    });

    connector.on("disconnect", () => {
      disconnect();
    });

    connector.on("error", error => {
      dispatch({
        status: STATUS.ERROR,
        error,
      });
    });

    connector.on("call_request", (error, payload) => {
      if (error) {
        dispatch({
          status: STATUS.ERROR,
          error,
        });
        return;
      }

      handleCallRequest(payload);
    });

    dispatch({
      error: null,
      connector,
      status: state.session.session ? STATUS.CONNECTED : STATUS.CONNECTING,
      dappInfo: state.session.session ? state.session.session.peerMeta : null,
    });
  };

  disconnect = () => {
    if (state.connector) {
      state.connector.killSession();
    }

    if (state.status !== STATUS.DISCONNECTED) {
      dispatch({
        session: null,
        dappInfo: null,
        error: null,
        connector: null,
        status: STATUS.DISCONNECTED,
      });

      onRemoteDisconnected();
    }
  };

  handleCallRequest = async payload => {
    if (state.currentCallRequestId) {
      state.connector.rejectRequest({
        id: payload.id,
        error: {
          message: "An other request is ongoing",
        },
      });
      return;
    }

    let wcCallRequest;

    try {
      wcCallRequest = await parseCallRequest(account, payload);
    } catch (e) {
      state.connector.rejectRequest({
        id: payload.id,
        error: {
          message: e.message || e,
        },
      });
    }

    const handler = onMessage(wcCallRequest, account);
    if (handler) {
      dispatch({
        currentCallRequestId: payload.id,
      });
      handler();
    } else {
      state.connector.rejectRequest({
        id: payload.id,
        error: {
          message: "Request not supported",
        },
      });
    }
  };

  approveSession = account => {
    if (!state.connector || account.type !== "Account") {
      return;
    }
    state.connector.approveSession({
      accounts: [account.freshAddress],
      chainId: account.currency.ethereumLikeInfo?.chainId,
    });
    dispatch({
      session: {
        accountId: account.id,
      },
    });
  };

  setCurrentCallRequestResult = result => {
    if (!state.currentCallRequestId || !state.connector) {
      return;
    }

    state.connector.approveRequest({
      id: state.currentCallRequestId,
      result,
    });
    dispatch({
      currentCallRequestId: null,
    });
  };
  setCurrentCallRequestError = error => {
    if (!state.currentCallRequestId || !state.connector) {
      return;
    }

    state.connector.rejectRequest({
      id: state.currentCallRequestId,
      error: { message: error.message },
    });
    dispatch({
      currentCallRequestId: null,
    });
  };

  // effects

  useEffect(() => {
    if (state.initDone) {
      return;
    }

    const init = async () => {
      dispatch({
        session: (await getWCSession()) || {},
        initDone: true,
      });
    };

    init();
  }, [getWCSession, state.initDone]);
  useEffect(() => {
    if (!state.initDone) {
      return;
    }
    saveWCSession(state.session);
  }, [saveWCSession, state.initDone, state.session]);

  useEffect(() => {
    if (
      account &&
      state.session.session &&
      state.status === STATUS.DISCONNECTED &&
      isReady
    ) {
      connect();

      onSessionRestarted(account);
    }
  });

  useEffect(() => {
    if (!state.session.session) {
      dispatch({
        socketReady: false,
      });
      return;
    }

    const interval = setInterval(() => {
      dispatch({
        // eslint-disable-next-line no-underscore-dangle
        socketReady: state.connector?._transport?._socket?.readyState === 1,
      });
    }, 1000);

    // eslint-disable-next-line consistent-return
    return () => {
      clearInterval(interval);
    };
  }, [state.session.session, state.connector]);

  return <context.Provider value={state}>{children}</context.Provider>;
};

//

const useAccount = accountId => {
  const { account } = useSelector(
    accountScreenSelector({
      params: { accountId },
    }),
  );
  return account;
};

const Provider = ({ children }: { children: React$Node }) => {
  const [isReady, setIsReady] = useState(false);
  useEffect(() => {
    if (isReady) {
      return;
    }

    const interval = setInterval(() => {
      setIsReady(!!navigationRef.current);
    }, 500);

    // eslint-disable-next-line consistent-return
    return () => clearInterval(interval);
  });

  return (
    <ProviderCommon
      onMessage={(wcCallRequest, account) => {
        if (
          wcCallRequest.type === "transaction" &&
          wcCallRequest.method === "send"
        ) {
          return () =>
            navigate(NavigatorName.SendFunds, {
              screen: ScreenName.SendSummary,
              params: {
                transaction: wcCallRequest.data,
                accountId: account.id,
              },
            });
        }

        if (wcCallRequest.type === "message") {
          return () =>
            navigate(NavigatorName.SignMessage, {
              screen: ScreenName.SignSummary,
              params: {
                message: wcCallRequest.data,
                accountId: account.id,
              },
            });
        }

        return false;
      }}
      onSessionRestarted={account => {
        navigate(NavigatorName.Base, {
          screen: ScreenName.WalletConnectConnect,
          params: {
            accountId: account.id,
          },
        });
      }}
      onRemoteDisconnected={() => {
        navigate(NavigatorName.Base, {
          screen: NavigatorName.Main,
        });
      }}
      useAccount={useAccount}
      isReady={isReady}
      saveWCSession={saveWCSession}
      getWCSession={getWCSession}
    >
      {children}
    </ProviderCommon>
  );
};

export default Provider;
