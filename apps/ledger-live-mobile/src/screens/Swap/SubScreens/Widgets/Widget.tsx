import React, {
  useMemo,
  useCallback,
  useRef,
  useEffect,
  useState,
} from "react";
import { TouchableOpacity } from "react-native-gesture-handler";
import { WebView } from "react-native-webview";
import { useDispatch, useSelector } from "react-redux";
import { useNavigation, useTheme } from "@react-navigation/native";
import {
  WidgetTypes,
  getFTXURL,
} from "@ledgerhq/live-common/exchange/swap/utils/index";
import { Icon, Flex } from "@ledgerhq/native-ui";
import { Message } from "@ledgerhq/live-common/exchange/swap/types";
import { swapKYCSelector } from "../../../../reducers/settings";
import { setSwapKYCStatus } from "../../../../actions/settings";
import { Loading } from "../../Loading";
import { ScreenName } from "../../../../const";
import { StackNavigatorNavigation } from "../../../../components/RootNavigator/types/helpers";
import { SwapFormNavigatorParamList } from "../../../../components/RootNavigator/types/SwapFormNavigator";

interface Props {
  provider: string;
  type: WidgetTypes;
}

export function Widget({ provider, type }: Props) {
  const navigation =
    useNavigation<StackNavigatorNavigation<SwapFormNavigatorParamList>>();
  const dispatch = useDispatch();
  const { dark } = useTheme();

  const uri = useWidgetURL(provider, type);
  const authToken = useAuthToken(provider);

  const ref = useRef<WebView>();

  // workaround: iOS does not provide a method to clear localStorage for webview. When browser accessing /login, it automatically remove authToken from localStorage only on inital load. (FTX redirects to otx.ftx.com/sso with a new token after user submits login form. Then it re-redirects back to /login to setToken and closeWidget.)
  const [redirected, setRedirected] = useState(false);

  const preload = useMemo(
    () => `
      try {
        window.ledger = {
          setToken: token => {
            const message = JSON.stringify({
              type: "setToken",
              token,
            });
            window.ReactNativeWebView.postMessage(message);
          },
          closeWidget: () => {
            const message = JSON.stringify({
              type: "closeWidget",
            });
            window.ReactNativeWebView.postMessage(message);
          }
        };

        localStorage.setItem("theme", "${dark ? "dark" : "light"}");

        if (location.pathname.includes("/login") && !${redirected}) {
          localStorage.removeItem("authToken");
        } else if (location.pathname.includes("/kyc")) {
          localStorage.setItem("authToken", "${authToken}");
        }
      } catch(e) {
        alert(e)
      }

      true;
    `,
    [authToken, dark, redirected],
  );

  const handleMessage = useCallback(
    e => {
      try {
        const data: Message = JSON.parse(e.nativeEvent.data);
        switch (data.type) {
          case "navigation":
            setRedirected(true);
            break;
          case "setToken":
            dispatch(
              setSwapKYCStatus({
                provider,
                id: data?.token,
                status: null,
              }),
            );
            break;
          case "closeWidget":
            navigation.navigate(ScreenName.SwapForm, {});
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

  const reload = useCallback(() => {
    if (!ref.current) {
      return;
    }

    ref.current.reload();
  }, []);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => <HeaderRight onPress={reload} />,
    });
  }, [navigation, reload]);

  return (
    <WebView
      // @ts-expect-error lib type has issues
      ref={ref}
      source={{
        uri,
      }}
      // to allow signin with Google
      userAgent="ledger-live-mobile"
      injectedJavaScriptBeforeContentLoaded={preload}
      sharedCookiesEnabled={true}
      onMessage={handleMessage}
      startInLoadingState
      renderLoading={() => (
        <Flex
          flex={1}
          position="absolute"
          top="0"
          right="0"
          bottom="0"
          left="0"
          backgroundColor="background.main"
        >
          <Loading />
        </Flex>
      )}
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

function HeaderRight({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress}>
      <Flex marginRight={4}>
        <Icon name="Reverse" size={24} color="neutral.c100" />
      </Flex>
    </TouchableOpacity>
  );
}
