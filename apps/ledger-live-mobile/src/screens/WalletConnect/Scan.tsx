import React, { useEffect, useContext } from "react";
import Config from "react-native-config";
import Clipboard from "@react-native-community/clipboard";
import { Trans } from "react-i18next";
import Scanner from "../../components/Scanner";
import { NavigatorName, ScreenName } from "../../const";
import { TrackScreen } from "../../analytics";
import { connect, context, STATUS } from "./Provider";

type Props = {
  navigation: any;
  route: {
    params: RouteParams;
  };
};
type RouteParams = {
  accountId: string;
};

const ScanWalletConnect = ({ navigation, route }: Props) => {
  const wcContext = useContext(context);
  useEffect(() => {
    let mockTO: ReturnType<typeof setTimeout>;

    if (Config.MOCK_SCAN_WALLETCONNECT) {
      mockTO = setTimeout(async () => {
        onResult(await Clipboard.getString());
      }, 2000);
    }

    return () => clearTimeout(mockTO);
  });

  const onResult = (uri: string) => {
    if (wcContext.status !== STATUS.DISCONNECTED) {
      return;
    }

    connect(uri);
    navigation.replace(NavigatorName.WalletConnect, {
      screen: ScreenName.WalletConnectConnect,
      params: {
        uri,
        accountId: route.params.accountId,
      },
    });
  };

  return (
    <>
      <TrackScreen category="WalletConnect" screen="Scan" />
      <Scanner
        onResult={onResult}
        instruction={<Trans i18nKey="walletconnect.scan" />}
      />
    </>
  );
};

export default ScanWalletConnect;
