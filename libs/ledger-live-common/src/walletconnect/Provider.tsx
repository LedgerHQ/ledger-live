import React, { useEffect, useReducer } from "react";
import WalletConnectClient from "@walletconnect/client";
import { parseCallRequest } from "./index";
import type { AccountLike } from "@ledgerhq/types-live";
export const STATUS = {
  DISCONNECTED: 0x00,
  CONNECTING: 0x01,
  ERROR: 0x02,
  CONNECTED: 0x03,
};
const clientMeta = {
  description: "LedgerLive",
  url: "https://ledger.fr",
  icons: ["https://cdn.live.ledger.com/live/icon-512.png"],
  name: "LedgerLive",
};
type State = {
  status: number;
  initDone: boolean;
  session: {
    accountId?: string;
    session?: {
      peerMeta: any;
    };
  };
  socketReady: boolean;
  connector: any;
  error: any | null;
  currentCallRequestId: string | null;
  dappInfo: any | null;
};
// actions
// it makes them available and current from connector events handlers
export let connect: (uri?: string) => void = () => {};
export let disconnect: (...args: Array<any>) => any = () => {};
export let approveSession: (account: AccountLike) => void = () => {};
export let setCurrentCallRequestResult: (...args: Array<any>) => any = () => {};
export let setCurrentCallRequestError: (...args: Array<any>) => any = () => {};
export let handleCallRequest: (payload: any) => Promise<any> = () => Promise.resolve();

// reducer
const reducer = (state: State, update) => {
  return {
    ...state,
    ...update,
    session: update.session === null ? {} : { ...state.session, ...(update.session || {}) },
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

type Props = {
  children: React.ReactNode;
  useAccount: (...args: Array<any>) => any;
  onMessage: (...args: Array<any>) => any;
  onSessionRestarted: (...args: Array<any>) => any;
  onRemoteDisconnected: (...args: Array<any>) => any;
  isReady: boolean;
  saveWCSession: (...args: Array<any>) => any;
  getWCSession: (...args: Array<any>) => any;
  WalletConnect?: typeof WalletConnectClient;
};

const ProviderCommon = ({
  children,
  useAccount,
  onMessage,
  onSessionRestarted,
  onRemoteDisconnected,
  isReady,
  saveWCSession,
  getWCSession,
  WalletConnect = WalletConnectClient,
}: Props): JSX.Element => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const account = useAccount(state.session.accountId);

  // actions
  connect = uri => {
    let connector;

    try {
      connector = new WalletConnect(
        state.session.session
          ? {
              session: state.session.session,
            }
          : {
              uri,
              clientMeta,
            },
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
    connector.on("disconnect", () => disconnect());
    connector.on("error", (error: Error) => {
      dispatch({
        status: STATUS.ERROR,
        error,
      });
    });
    connector.on("call_request", (error: Error, payload: unknown | null) => {
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

  disconnect = async () => {
    if (state.connector) {
      // Workaround for an error while trying to kill the session and it returns a error
      // It lets the user in a state where he can't connect anymore even after relaunching the live
      // See ref: https://github.com/WalletConnect/walletconnect-monorepo/issues/315#issuecomment-830695953
      try {
        await state.connector.killSession();
      } catch (e) {
        // using optional chaining to prevent it from crashing on mobile
        window?.localStorage?.removeItem("walletconnect");
      }
    }

    if (state.status !== STATUS.DISCONNECTED) {
      const disconnectedAccount = state.status === STATUS.CONNECTED ? account : null;
      dispatch({
        session: null,
        dappInfo: null,
        error: null,
        connector: null,
        currentCallRequestId: null,
        status: STATUS.DISCONNECTED,
      });
      onRemoteDisconnected(disconnectedAccount);
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
    } catch (e: any) {
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
      error: {
        message: error.message,
      },
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
    if (account && state.session.session && state.status === STATUS.DISCONNECTED && isReady) {
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

export default ProviderCommon;
