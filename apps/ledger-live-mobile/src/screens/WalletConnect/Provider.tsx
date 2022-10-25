import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import ProviderCommon from "@ledgerhq/live-common/walletconnect/Provider";
import { saveWCSession, getWCSession } from "../../db";
import { accountScreenSelector } from "../../reducers/accounts";
import { NavigatorName, ScreenName } from "../../const";
import { navigate, isReadyRef } from "../../rootnavigation";

const useAccount = accountId => {
  const { account } = useSelector(
    accountScreenSelector({
      params: {
        accountId,
      },
    }),
  );
  return account;
};

const Provider = ({ children }: { children: React.ReactNode }) => {
  const [isReady, setIsReady] = useState(false);
  useEffect(() => {
    if (isReady) {
      return;
    }

    const interval = setInterval(() => {
      setIsReady(!!isReadyRef.current);
    }, 500);
    // eslint-disable-next-line consistent-return
    return () => clearInterval(interval);
  });
  return (
    // $FlowFixMe
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
          screen: NavigatorName.WalletConnect,
          params: {
            screen: ScreenName.WalletConnectConnect,
            params: {
              accountId: account.id,
            },
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

export * from "@ledgerhq/live-common/walletconnect/Provider";
export default Provider;
