import { MakeModalsType, GlobalModalData, ModalData } from "./types";
import { coinModals } from "../families/generated";
import MODAL_WEBSOCKET_BRIDGE from "./WebSocketBridge";
import MODAL_EXPORT_OPERATIONS from "./ExportOperations";
import MODAL_PASSWORD from "./PasswordModal";
import MODAL_DISABLE_PASSWORD from "./DisablePasswordModal";
import MODAL_ADD_ACCOUNTS from "./AddAccounts";
import MODAL_RECEIVE from "./Receive";
import MODAL_SEND from "./Send";
import MODAL_SIGN_MESSAGE from "./SignMessage";
import MODAL_SIGN_TRANSACTION from "./SignTransaction";
import MODAL_SIGN_RAW_TRANSACTION from "./SignRawTransaction";
import MODAL_NO_FUNDS_STAKE from "./NoFundsStake";
import MODAL_SETTINGS_ACCOUNT from "./SettingsAccount";
import MODAL_RELEASE_NOTES from "./ReleaseNotes";
import MODAL_TROUBLESHOOT_NETWORK from "./TroubleshootNetwork";
import MODAL_SYSTEM_LANGUAGE_AVAILABLE from "./SystemLanguageAvailable";
import MODAL_START_STAKE from "./StartStake";
import MODAL_TERM_OF_USE_UPDATE from "./TermOfUseUpdate";
import MODAL_EXCHANGE_CRYPTO_DEVICE from "./ExchangeDeviceConfirm";
import MODAL_PLATFORM_EXCHANGE_START from "./Platform/Exchange/StartExchange";
import MODAL_PLATFORM_EXCHANGE_COMPLETE from "./Platform/Exchange/CompleteExchange";
import MODAL_CONNECT_DEVICE from "./ConnectDevice";
import MODAL_LOTTIE_DEBUGGER from "./LottieDebugger";
import MODAL_CREATE_LOCAL_APP from "./CreateLocalManifest";
import MODAL_BLACKLIST_TOKEN from "./BlacklistToken";
import MODAL_PROTECT_DISCOVER from "./ProtectDiscover";
import MODAL_CONFIRM from "./ConfirmModal";
import MODAL_ERROR from "./ErrorModal";
import MODAL_VAULT_SIGNER from "./VaultSigner";

import MODAL_WALLET_SYNC_DEBUGGER from "./WalletSyncDebugger";
import MODAL_BRAZE_TOOLS from "../screens/settings/sections/Developer/tools/BrazeTools/Modal";

type GlobalModals = MakeModalsType<GlobalModalData>;

const globalModals: GlobalModals = {
  MODAL_WEBSOCKET_BRIDGE,
  MODAL_EXPORT_OPERATIONS,
  MODAL_PASSWORD,
  MODAL_DISABLE_PASSWORD,
  MODAL_ADD_ACCOUNTS,
  MODAL_RECEIVE,
  MODAL_SEND,
  MODAL_SIGN_MESSAGE,
  MODAL_SIGN_TRANSACTION,
  MODAL_SIGN_RAW_TRANSACTION,
  MODAL_NO_FUNDS_STAKE,
  MODAL_SETTINGS_ACCOUNT,
  MODAL_RELEASE_NOTES,
  MODAL_TROUBLESHOOT_NETWORK,
  MODAL_SYSTEM_LANGUAGE_AVAILABLE,
  MODAL_TERM_OF_USE_UPDATE,
  MODAL_BLACKLIST_TOKEN,
  MODAL_EXCHANGE_CRYPTO_DEVICE,
  MODAL_LOTTIE_DEBUGGER,
  MODAL_START_STAKE,
  MODAL_PROTECT_DISCOVER,
  MODAL_CREATE_LOCAL_APP,
  MODAL_WALLET_SYNC_DEBUGGER,
  MODAL_BRAZE_TOOLS,

  // Platform
  MODAL_PLATFORM_EXCHANGE_START,
  MODAL_PLATFORM_EXCHANGE_COMPLETE,
  MODAL_CONNECT_DEVICE,

  // Vault,
  MODAL_VAULT_SIGNER,

  // NB We have dettached modals such as the repair modal,
  // in the meantime, we can rely on this to add the backdrop
  MODAL_STUB: () => null,

  MODAL_CONFIRM,
  MODAL_ERROR,
};

export type Modals = MakeModalsType<ModalData>;

const modals: Modals = {
  ...globalModals,
  ...coinModals,
};

export default modals;
