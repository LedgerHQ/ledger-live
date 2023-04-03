import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import ProviderCommon, {
  setCurrentCallRequestError,
  setCurrentCallRequestResult,
} from "@ledgerhq/live-common/walletconnect/Provider";
import { getEnv } from "@ledgerhq/live-common/env";
import { useHistory } from "react-router-dom";
import { accountSelector } from "~/renderer/reducers/accounts";
import { openModal, closeAllModal } from "~/renderer/actions/modals";
import WalletConnectClientMock from "~/../tests/mocks/WalletConnectClient";
const useAccount = accountId => {
  return useSelector(s =>
    accountSelector(s, {
      accountId,
    }),
  );
};

const Provider = ({ children }: { children: React.ReactNode }) => {
  const [isReady] = useState(true);
  const history = useHistory();
  const dispatch = useDispatch();
  const rest = {};
  if (getEnv("PLAYWRIGHT_RUN")) {
    rest.WalletConnect = WalletConnectClientMock;
  }
  return (
    <ProviderCommon
      onMessage={(wcCallRequest, account) => {
        if (wcCallRequest.type === "transaction" && wcCallRequest.method === "send") {
          return () => {
            dispatch(
              openModal("MODAL_SEND", {
                transaction: wcCallRequest.data,
                recipient: wcCallRequest.data.recipient,
                walletConnectProxy: true,
                stepId: "amount",
                account,
                onConfirmationHandler: operation => {
                  setCurrentCallRequestResult(operation.hash);
                },
                onFailHandler: err => {
                  setCurrentCallRequestError(err);
                },
                onClose: () => {
                  setCurrentCallRequestError("cancelled");
                },
                disableBacks: ["amount"],
              }),
            );
          };
        }
        if (wcCallRequest.type === "message") {
          return () => {
            dispatch(
              openModal("MODAL_SIGN_MESSAGE", {
                message: wcCallRequest.data,
                account,
                onConfirmationHandler: signature => {
                  setCurrentCallRequestResult(signature);
                },
                onFailHandler: err => {
                  console.log("err", err);
                  setCurrentCallRequestError(err);
                },
                onClose: () => {
                  setCurrentCallRequestError({
                    message: "cancelled",
                  });
                },
              }),
            );
          };
        }
        return false;
      }}
      onSessionRestarted={account => {
        history.push({
          pathname: "/walletconnect",
        });
      }}
      onRemoteDisconnected={disconnectedAccount => {
        if (disconnectedAccount) {
          dispatch(closeAllModal());
          history.push({
            pathname: `/account/${disconnectedAccount.id}`,
          });
        }
      }}
      useAccount={useAccount}
      isReady={isReady}
      saveWCSession={session => {
        try {
          window.localStorage.setItem("wc_session", JSON.stringify(session));
        } catch (e) {}
      }}
      getWCSession={() => {
        try {
          return JSON.parse(window.localStorage.getItem("wc_session"));
        } catch (e) {}
      }}
      {...rest}
    >
      {children}
    </ProviderCommon>
  );
};
export {
  STATUS,
  context,
  connect,
  disconnect,
  approveSession,
  handleCallRequest,
} from "@ledgerhq/live-common/walletconnect/Provider";
export { setCurrentCallRequestResult, setCurrentCallRequestError };
export default Provider;
