import generated from "../generated/modals";

import MODAL_WEBSOCKET_BRIDGE from "./WebSocketBridge";
import MODAL_EXPORT_OPERATIONS from "./ExportOperations";
import MODAL_PASSWORD from "./PasswordModal";
import MODAL_DISABLE_PASSWORD from "./DisablePasswordModal";
import MODAL_ADD_ACCOUNTS from "./AddAccounts";
import MODAL_RECEIVE from "./Receive";
import MODAL_SEND from "./Send";
import MODAL_SIGN_MESSAGE from "./SignMessage";
import MODAL_SIGN_TRANSACTION from "./SignTransaction";
import MODAL_NO_FUNDS_STAKE from "./NoFundsStake";
import MODAL_EXPORT_ACCOUNTS from "./ExportAccounts";
import MODAL_SETTINGS_ACCOUNT from "./SettingsAccount";
import MODAL_RELEASE_NOTES from "./ReleaseNotes";
import MODAL_TROUBLESHOOT_NETWORK from "./TroubleshootNetwork";
import MODAL_SYSTEM_LANGUAGE_AVAILABLE from "./SystemLanguageAvailable";
import MODAL_START_STAKE from "./StartStake";
import MODAL_TERM_OF_USE_UPDATE from "./TermOfUseUpdate";
import MODAL_EXCHANGE_CRYPTO_DEVICE from "./ExchangeDeviceConfirm";
import MODAL_SWAP_RESET_KYC from "./Swap/ResetKYC";
import MODAL_PLATFORM_EXCHANGE_START from "./Platform/Exchange/StartExchange";
import MODAL_PLATFORM_EXCHANGE_COMPLETE from "./Platform/Exchange/CompleteExchange";
import MODAL_CONNECT_DEVICE from "./ConnectDevice";
import MODAL_LOTTIE_DEBUGGER from "./LottieDebugger";
import MODAL_STORYLY_DEBUGGER from "./StorylyDebugger";
import MODAL_BLACKLIST_TOKEN from "./BlacklistToken";
import MODAL_HIDE_NFT_COLLECTION from "./HideNftCollection";
import MODAL_PROTECT_DISCOVER from "./ProtectDiscover";

type ModalComponent = unknown; // FIXME determine the common ground to modals
type Modals = Record<string, ModalComponent>;

const modals: Modals = {
  MODAL_WEBSOCKET_BRIDGE,
  MODAL_EXPORT_OPERATIONS,
  MODAL_PASSWORD,
  MODAL_DISABLE_PASSWORD,
  MODAL_ADD_ACCOUNTS,
  MODAL_RECEIVE,
  MODAL_SEND,
  MODAL_SIGN_MESSAGE,
  MODAL_SIGN_TRANSACTION,
  MODAL_NO_FUNDS_STAKE,
  MODAL_EXPORT_ACCOUNTS,
  MODAL_SETTINGS_ACCOUNT,
  MODAL_RELEASE_NOTES,
  MODAL_TROUBLESHOOT_NETWORK,
  MODAL_SYSTEM_LANGUAGE_AVAILABLE,
  MODAL_TERM_OF_USE_UPDATE,
  MODAL_BLACKLIST_TOKEN,
  MODAL_HIDE_NFT_COLLECTION,
  MODAL_EXCHANGE_CRYPTO_DEVICE,
  MODAL_LOTTIE_DEBUGGER,
  MODAL_STORYLY_DEBUGGER,
  MODAL_START_STAKE,
  MODAL_PROTECT_DISCOVER,
  // Swap
  MODAL_SWAP_RESET_KYC,
  // Platform
  MODAL_PLATFORM_EXCHANGE_START,
  MODAL_PLATFORM_EXCHANGE_COMPLETE,
  MODAL_CONNECT_DEVICE,

  // NB We have dettached modals such as the repair modal,
  // in the meantime, we can rely on this to add the backdrop
  MODAL_STUB: () => null,
};

for (const family in generated) {
  const components = (generated as Record<string, Modals>)[family] as Modals;
  for (const name in components) {
    if (name in modals) {
      throw new Error(
        `modal ${name} already exists. Make sure there is no name collision between families.`,
      );
    }
    modals[name] = components[name];
  }
}

export default modals;
