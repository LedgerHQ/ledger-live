import React, { useMemo, useCallback } from "react";
import { WebView } from "react-native-webview";
import { useNavigation, useTheme } from "@react-navigation/native";
import {
  WidgetTypes,
  getFTXURL,
} from "@ledgerhq/live-common/lib/exchange/swap/utils";
import { Message } from "@ledgerhq/live-common/lib/exchange/swap/types";
import { useDispatch, useSelector } from "react-redux";
import { swapKYCSelector } from "../../../../reducers/settings";
import { setSwapKYCStatus } from "../../../../actions/settings";

interface Props {
  provider: string;
  type: WidgetTypes;
}

export function Widget({ provider, type }: Props) {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { dark } = useTheme();

  const uri = useWidgetURL(provider, type);
  const authToken = useAuthToken(provider);

  const preload = useMemo(
    () => `
      window.ledger = { postMessage: window.ReactNativeWebView.postMessage };
      
      window.ledger.setToken = token => {
        const message = JSON.stringify({
          type: "setToken",
          token,
        });
        window.ledger.postMessage(message);
      };
      
      window.ledger.closeWidget = () => {
        const message = JSON.stringify({
          type: "closeWidget",
        });
        window.ledger.postMessage(message);
      };

      localStorage.setItem("authToken", "${authToken}");
      localStorage.setItem("theme", "${dark ? "dark" : "light"}");
  
      true;
    `,
    [authToken, dark],
  );

  const handleMessage = useCallback(
    ({ nativeEvent: { data: dataStr } }) => {
      try {
        const data: Message = JSON.parse(dataStr);
        console.log(data);

        switch (data.type) {
          case "setToken":
            dispatch(
              setSwapKYCStatus({
                provider,
                id: data?.token,
                status: undefined,
              }),
            );
            break;
          case "closeWidget":
            navigation.pop();
            break;
          default:
            break;
        }
      } catch (e) {
        console.error(e);
      }
    },
    [navigation, dispatch, provider],
  );

  return (
    <WebView
      source={{
        // html: `<button onclick="window.ledger.setToken('fake-token')">click</button>`,
        uri,
      }}
      injectedJavaScriptBeforeContentLoaded={preload}
      onMessage={handleMessage}
      onError={console.error}
    />
  );
}

function useAuthToken(provider: Props["provider"]): string | undefined {
  const kyc = useSelector(swapKYCSelector)?.[provider];
  return kyc?.id;
}

function useWidgetURL(
  provider: Props["provider"],
  type: Props["type"],
): string {
  return useMemo(() => {
    switch (provider) {
      case "ftx":
      case "ftxus":
        return getFTXURL({ type, provider });
      default:
        throw new Error(`widget is not supported by provider: ${provider}`);
    }
  }, [type, provider]);
}
