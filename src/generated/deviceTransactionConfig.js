// @flow
import bitcoin from "../families/bitcoin/deviceTransactionConfig.js";
import ethereum from "../families/ethereum/deviceTransactionConfig.js";
import ripple from "../families/ripple/deviceTransactionConfig.js";
import stellar from "../families/stellar/deviceTransactionConfig.js";
import tezos from "../families/tezos/deviceTransactionConfig.js";
import tron from "../families/tron/deviceTransactionConfig.js";

export default {
  bitcoin,
  ethereum,
  ripple,
  stellar,
  tezos,
  tron,
};
import type { ExtraDeviceTransactionField as ExtraDeviceTransactionField_stellar } from "../families/stellar/deviceTransactionConfig";
import type { ExtraDeviceTransactionField as ExtraDeviceTransactionField_tezos } from "../families/tezos/deviceTransactionConfig";
import type { ExtraDeviceTransactionField as ExtraDeviceTransactionField_tron } from "../families/tron/deviceTransactionConfig";
export type ExtraDeviceTransactionField =
| ExtraDeviceTransactionField_stellar
| ExtraDeviceTransactionField_tezos
| ExtraDeviceTransactionField_tron
