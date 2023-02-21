import {
  buildCurrencyBridge,
  buildAccountBridge,
} from "@ledgerhq/coin-polkadot/bridge/js";
import { withDevice } from "../../../hw/deviceAccess";
import network from "../../../network";
import { makeLRUCache } from "../../../cache";

export default {
  currencyBridge: buildCurrencyBridge(withDevice, network, makeLRUCache),
  accountBridge: buildAccountBridge(withDevice, network, makeLRUCache),
};
