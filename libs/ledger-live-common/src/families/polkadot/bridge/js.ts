import {
  buildCurrencyBridge,
  buildAccountBridge,
} from "@ledgerhq/coin-polkadot/bridge/js";
import { withDevice } from "../../../hw/deviceAccess";
import network from "../../../network";

export default {
  currencyBridge: buildCurrencyBridge(withDevice, network),
  accountBridge: buildAccountBridge(withDevice, network),
};
