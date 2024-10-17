import React from "react";
import { useDispatch, useSelector } from "react-redux";
import Card from "~/renderer/components/Box/Card";
import {
  counterValueCurrencySelector,
  languageSelector,
  localeSelector,
} from "~/renderer/reducers/settings";
import { useRemoteLiveAppManifest } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import WebPlatformPlayer from "~/renderer/components/WebPlatformPlayer";
import useTheme from "~/renderer/hooks/useTheme";
import { useDeepLinkListener } from "~/renderer/screens/earn/useDeepLinkListener";
import { useDiscreetMode } from "~/renderer/components/Discreet";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index";
import { openModal } from "~/renderer/actions/modals";
import { Account } from "@ledgerhq/wallet-api-client";

const DEFAULT_EARN_APP_ID = "earn";

const Earn = () => {
	const dispatch = useDispatch();
  const language = useSelector(languageSelector);
  const locale = useSelector(localeSelector);
  const fiatCurrency = useSelector(counterValueCurrencySelector);
  const localManifest = useLocalLiveAppManifest(DEFAULT_EARN_APP_ID);
  const remoteManifest = useRemoteLiveAppManifest(DEFAULT_EARN_APP_ID);
  // const manifest = localManifest || remoteManifest;

  const manifest = {
		id: "earn",
		name: "Earn",
		url: "https://earn-live-app-staging.vercel.app/",
		homepageUrl: "https://earn-live-app-staging.vercel.app/",
		icon: "",
		platform: "all",
		apiVersion: "^2.0.0",
		manifestVersion: "2",
		branch: "experimental",
		categories: ["earn"],
		currencies: "*",
		content: {
			shortDescription: {
				en: "Earn dashboard",
			},
			description: {
				en: "Earn dashboard",
			},
		},
		permissions: [
			"account.list",
			"account.receive",
			"account.request",
			"currency.list",
			"device.close",
			"device.exchange",
			"device.transport",
			"message.sign",
			"transaction.sign",
			"transaction.signAndBroadcast",
			"storage.set",
			"storage.get",
			"bitcoin.getXPub",
			"wallet.capabilities",
			"wallet.userId",
			"wallet.info",
			"custom.open.kiln-widget",
		],
		domains: ["https://*"],
	};


  const themeType = useTheme().colors.palette.type;
  const discreetMode = useDiscreetMode();

  useDeepLinkListener();

  return (
    <Card grow style={{ overflow: "hidden" }} data-testid="earn-app-container">
      {manifest ? (
        <WebPlatformPlayer
          config={{
            topBarConfig: {
              shouldDisplayName: false,
              shouldDisplayInfo: false,
              shouldDisplayClose: false,
              shouldDisplayNavigation: false,
            },
          }}
          manifest={manifest}
          inputs={{
            theme: themeType,
            lang: language,
            locale: locale,
            currencyTicker: fiatCurrency.ticker,
            discreetMode: discreetMode ? "true" : "false",
            OS: "web",
          }}
          customHandlers={{
						"custom.open.kiln-widget": ({ account }: { account: Account }) => {
							dispatch(
								openModal("MODAL_EVM_DEFI", {
									account,
								}),
							);
						},
					}}
        />
      ) : null}
    </Card>
  );
};

export default Earn;
