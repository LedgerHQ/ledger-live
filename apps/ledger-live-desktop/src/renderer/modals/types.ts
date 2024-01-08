import React from "react";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Account, AccountLike } from "@ledgerhq/types-live";

import { Data as SendData } from "./Send/Body";
import { Data as ReceiveData } from "./Receive/Body";
import { Data as SignMessageData } from "./SignMessage/Body";
import { DataProp as ExchangeCryptoDeviceDataProp } from "./ExchangeDeviceConfirm/index";
import { Data as PlatformExchangeStartData } from "./Platform/Exchange/StartExchange/index";
import { Data as PlatformExchangeCompleteData } from "./Platform/Exchange/CompleteExchange/Body";
import { Data as ConnectDeviceData } from "./ConnectDevice/index";
import { Params as SignTransactionData } from "./SignTransaction/Body";
import { Props as ConfirmProps } from "./ConfirmModal";
import { Props as ErrorProps } from "./ErrorModal";
import { UserProps as AddAccountProps } from "./AddAccounts";
import { ModalStartStakeProps } from "./StartStake";
import { CoinModalsData } from "../families/generated";
import { Language } from "~/config/languages";

/**
 * the modals data type are all defined by a key value map,
 * where the key is the modal name, and the value is the data type that it can optionally takes
 * it is literally the two parameters of openModal(key, value)
 * once these types are defined, everything is infered at usage of openModal and <Modal>
 */

export type MakeModalsType<MData> = {
  [Name in keyof MData]: React.ComponentType<NonNullable<MData[Name]>>;
};

/**
 * these are all the LLD global modals (outside of the families own definitions)
 */
export type GlobalModalData = {
  MODAL_SEND: undefined | SendData;
  MODAL_RECEIVE: undefined | ReceiveData;
  MODAL_SETTINGS_ACCOUNT: {
    account: Account;
  };
  MODAL_PROTECT_DISCOVER: undefined;
  MODAL_RELEASE_NOTES: undefined;
  MODAL_SYSTEM_LANGUAGE_AVAILABLE: {
    osLanguage: Language;
    currentLanguage: Language;
  };
  MODAL_TERM_OF_USE_UPDATE: {
    acceptTerms: () => void;
  };
  MODAL_STUB: undefined;
  MODAL_ADD_ACCOUNTS: undefined | AddAccountProps;
  MODAL_BLACKLIST_TOKEN: {
    token: TokenCurrency;
  };
  MODAL_STORYLY_DEBUGGER: undefined;
  MODAL_LOTTIE_DEBUGGER: undefined;
  MODAL_EXPORT_ACCOUNTS: undefined;
  MODAL_EXPORT_OPERATIONS: undefined;
  MODAL_START_STAKE: ModalStartStakeProps;
  MODAL_SIGN_TRANSACTION: SignTransactionData;
  MODAL_SIGN_MESSAGE: SignMessageData;
  MODAL_TROUBLESHOOT_NETWORK: undefined;
  MODAL_NO_FUNDS_STAKE: {
    account: AccountLike | undefined | null;
    parentAccount?: Account | undefined | null;
    entryPoint?: "get-funds" | undefined;
  };
  MODAL_PASSWORD: undefined;
  MODAL_DISABLE_PASSWORD: undefined;
  MODAL_PLATFORM_EXCHANGE_START: PlatformExchangeStartData;
  MODAL_PLATFORM_EXCHANGE_COMPLETE: PlatformExchangeCompleteData;
  MODAL_CONNECT_DEVICE: ConnectDeviceData;
  MODAL_EXCHANGE_CRYPTO_DEVICE: ExchangeCryptoDeviceDataProp;
  MODAL_HIDE_NFT_COLLECTION: {
    collectionId: string;
    collectionName: string;
    onClose?: () => void;
  };
  MODAL_WEBSOCKET_BRIDGE: {
    origin?: string | undefined | null;
    appName?: string | undefined | null;
  };
  MODAL_CONFIRM: ConfirmProps;
  MODAL_ERROR: ErrorProps;
  MODAL_VAULT_SIGNER: undefined;
};

/**
 * finally, we make a union with the coin modals data and we obtain the complete modal data type.
 */
export type ModalData = GlobalModalData & CoinModalsData;
export type AllModalNames = keyof ModalData;
