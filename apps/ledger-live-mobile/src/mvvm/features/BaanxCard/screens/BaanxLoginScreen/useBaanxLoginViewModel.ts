import { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import {
  BAANX_WEB_APP_URL,
  parseBaanxWebViewMessage,
} from "@ledgerhq/baanx";
import { ScreenName } from "~/const";

let _baanxAccessToken: string | null = null;

export function getBaanxAccessToken(): string | null {
  return _baanxAccessToken;
}

export function clearBaanxAccessToken(): void {
  _baanxAccessToken = null;
}

export interface BaanxLoginViewModel {
  webAppUrl: string;
  onWebViewMessage: (data: string) => void;
}

export function useBaanxLoginViewModel(): BaanxLoginViewModel {
  const navigation = useNavigation<any>();

  const onWebViewMessage = useCallback(
    (data: string) => {
      const result = parseBaanxWebViewMessage(data);
      if (result) {
        _baanxAccessToken = result.accessToken;
        navigation.navigate(ScreenName.BaanxCardDashboard);
      }
    },
    [navigation],
  );

  return {
    webAppUrl: BAANX_WEB_APP_URL,
    onWebViewMessage,
  };
}
