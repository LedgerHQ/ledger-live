import { TokenCurrency, CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Account, AccountLike } from "@ledgerhq/types-live";

import { AppResult } from "@ledgerhq/live-common/hw/actions/app";
import { Data as SendData } from "./Send/Body";
import { Data as ReceiveData } from "./Receive/Body";
import { Data as SignMessageData } from "./SignMessage/Body";
import { DataProp as ExchangeCryptoDeviceDataProp } from "./ExchangeDeviceConfirm/index";
import { Data as PlatformExchangeCompleteData } from "./Platform/Exchange/CompleteExchange/Body";
import { Params as SignTransactionData } from "./SignTransaction/Body";
import { Props as ConfirmProps } from "./ConfirmModal";
import { Props as ErrorProps } from "./ErrorModal";

export type ModalData = {
  MODAL_SEND: undefined | SendData;
  MODAL_RECEIVE: undefined | ReceiveData;
  MODAL_SETTINGS_ACCOUNT: {
    account: Account;
  };
  MODAL_PROTECT_DISCOVER: undefined;
  MODAL_RELEASE_NOTES: undefined;
  MODAL_SYSTEM_LANGUAGE_AVAILABLE: {
    osLanguage: string;
    currentLanguage: string;
  };
  MODAL_TERM_OF_USE_UPDATE: {
    acceptTerms: () => void;
  };
  MODAL_STUB: undefined;
  MODAL_ADD_ACCOUNTS:
    | undefined
    | {
        currency?: CryptoCurrency | TokenCurrency | null;
        preventSkippingCurrencySelection?: boolean;
        flow?: string;
        onClose?: () => void;
      };
  MODAL_BLACKLIST_TOKEN: {
    token: TokenCurrency;
  };
  MODAL_SWAP_RESET_KYC: undefined;
  MODAL_STORYLY_DEBUGGER: undefined;
  MODAL_LOTTIE_DEBUGGER: undefined;
  MODAL_BITCOIN_FULL_NODE:
    | undefined
    | {
        skipNodeSetup?: boolean;
      };
  MODAL_PLATFORM_EXCHANGE_COMPLETE: PlatformExchangeCompleteData;
  MODAL_EXPORT_ACCOUNTS: undefined;
  MODAL_EXPORT_OPERATIONS: undefined;
  MODAL_START_STAKE: {
    account?: AccountLike | undefined | null;
    parentAccount?: Account | undefined | null;
    source?: string;
  };
  MODAL_SIGN_TRANSACTION: SignTransactionData;
  MODAL_SIGN_MESSAGE: SignMessageData;
  MODAL_DELEGATE: {
    account: AccountLike | undefined | null;
    parentAccount: Account | undefined | null;
    mode?: string | undefined | null;
    eventType?: string;
    stepId?: string;
  };
  MODAL_TROUBLESHOOT_NETWORK: undefined;
  MODAL_ETH_STAKE: {
    account: Account;
    checkbox?: boolean;
    singleProviderRedirectMode?: boolean;
    source?: string;
  };
  MODAL_NO_FUNDS_STAKE: {
    account?: AccountLike | undefined | null;
    parentAccount?: Account | undefined | null;
  };
  MODAL_PASSWORD: undefined;
  MODAL_DISABLE_PASSWORD: undefined;
  MODAL_PLATFORM_EXCHANGE_START: {
    onCancel?: (_: string) => void;
    exchangeType: unknown;
    onResult: (startExchangeResult: string) => void;
  };
  MODAL_CONNECT_DEVICE: {
    onCancel?: (reason: string) => void;
    appName?: string;
    onResult: (result: AppResult) => void;
  };
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
  MODAL_ALGORAND_EARN_REWARDS_INFO: undefined;
  MODAL_CONFIRM: ConfirmProps;
  MODAL_ERROR: ErrorProps;
};
