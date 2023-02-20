import {
  buildCurrencyBridge,
  buildAccountBridge,
} from "@ledgerhq/coin-polkadot/bridge/js";
import { withDevice } from "../../../hw/deviceAccess";

export default {
  currencyBridge: buildCurrencyBridge(withDevice),
  accountBridge: buildAccountBridge(withDevice),
};
