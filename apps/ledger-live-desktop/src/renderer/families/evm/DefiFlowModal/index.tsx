import React, { forwardRef, useEffect, useMemo, useRef } from "react";
import Modal, { ModalBody } from "~/renderer/components/Modal";
import { Flex } from "@ledgerhq/react-ui";
import WebPlatformPlayer from "~/renderer/components/WebPlatformPlayer";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { modalsStateSelector } from "~/renderer/reducers/modals";
import { useDispatch, useSelector } from "react-redux";
import { Account } from "@ledgerhq/wallet-api-client";

type Props = {
	account: Account;
};

const KILN_WIDGET_MANIFEST: LiveAppManifest = {
	content: {
		description: { en: "" },
		shortDescription: { en: "" },
	},
	platforms: ["desktop"],
	visibility: "deep",
	id: "kiln-widget",
	name: "Kiln Widget",
	// url: "https://kiln.widget.test/earn",
	url: "https://ledger-live.widget.test/earn",
	// url: "https://dapp-browser.apps.ledger.com",
	// params: {
	// 	dappUrl: "https://kiln.widget.test/earn",
	// 	networks: [
	// 		{
	// 			currency: "ethereum",
	// 			chainID: 1,
	// 			nodeURL:
	// 				"https://skilled-thrumming-morning.ethereum-holesky.quiknode.pro/d43a40d4e611ccf5141018a904bd59f5447c609a",
	// 		},
	// 	],
	// },
	homepageUrl: "https://kiln.fi",
	icon: "",
	apiVersion: "^2.0.0",
	manifestVersion: "2",
	branch: "experimental",
	categories: ["staking"],
	currencies: "*",
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
		"wallet.capabilities",
		"wallet.userId",
		"wallet.info",
		"custom.account.get",
	],
	domains: ["https://*"],
};

const DefiModal = forwardRef(function DefiModal({ account }: Props, ref) {
	const modalsState = useSelector(modalsStateSelector);

	return (
		<Modal
			name="MODAL_EVM_DEFI"
			centered
			width={800}
			bodyStyle={{ height: "1000" }}
			render={({ onClose }) => (
				<ModalBody
					pt={0}
					title={"Stablecoin Lending"}
					noScroll
					onClose={onClose}
					render={() => (
						<Flex
							justifyContent={"center"}
							height="1000px"
							style={{
								opacity: modalsState.MODAL_SIGN_TRANSACTION?.isOpened
									? "0.1"
									: "1",
							}}
						>
							<WebPlatformPlayer
								config={{
									topBarConfig: {
										shouldDisplayName: false,
										shouldDisplayInfo: false,
										shouldDisplayClose: false,
										shouldDisplayNavigation: false,
									},
								}}
								manifest={KILN_WIDGET_MANIFEST}
								customHandlers={{
									"custom.account.get": () => {
										return account;
									},
								}}
							/>
						</Flex>
					)}
				/>
			)}
		/>
	);
});

export default DefiModal;
