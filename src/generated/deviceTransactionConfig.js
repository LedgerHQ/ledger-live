// @flow
import algorand from "../families/algorand/deviceTransactionConfig.js";
import bitcoin from "../families/bitcoin/deviceTransactionConfig.js";
import cosmos from "../families/cosmos/deviceTransactionConfig.js";
import ethereum from "../families/ethereum/deviceTransactionConfig.js";
import polkadot from "../families/polkadot/deviceTransactionConfig.js";
import ripple from "../families/ripple/deviceTransactionConfig.js";
import stellar from "../families/stellar/deviceTransactionConfig.js";
import tezos from "../families/tezos/deviceTransactionConfig.js";
import tron from "../families/tron/deviceTransactionConfig.js";

export default {
  algorand,
  bitcoin,
  cosmos,
  ethereum,
  polkadot,
  ripple,
  stellar,
  tezos,
  tron,
};
import type { ExtraDeviceTransactionField as ExtraDeviceTransactionField_cosmos } from "../families/cosmos/deviceTransactionConfig";
import type { ExtraDeviceTransactionField as ExtraDeviceTransactionField_polkadot } from "../families/polkadot/deviceTransactionConfig";
import type { ExtraDeviceTransactionField as ExtraDeviceTransactionField_stellar } from "../families/stellar/deviceTransactionConfig";
import type { ExtraDeviceTransactionField as ExtraDeviceTransactionField_tezos } from "../families/tezos/deviceTransactionConfig";
import type { ExtraDeviceTransactionField as ExtraDeviceTransactionField_tron } from "../families/tron/deviceTransactionConfig";
export type ExtraDeviceTransactionField =
| ExtraDeviceTransactionField_cosmos
| ExtraDeviceTransactionField_polkadot
| ExtraDeviceTransactionField_stellar
| ExtraDeviceTransactionField_tezos
| ExtraDeviceTransactionField_tron
