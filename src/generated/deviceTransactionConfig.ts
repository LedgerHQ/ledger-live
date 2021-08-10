import algorand from "../families/algorand/deviceTransactionConfig";

import bitcoin from "../families/bitcoin/deviceTransactionConfig";

import cosmos from "../families/cosmos/deviceTransactionConfig";

import ethereum from "../families/ethereum/deviceTransactionConfig";

import polkadot from "../families/polkadot/deviceTransactionConfig";

import ripple from "../families/ripple/deviceTransactionConfig";

import stellar from "../families/stellar/deviceTransactionConfig";

import tezos from "../families/tezos/deviceTransactionConfig";

import tron from "../families/tron/deviceTransactionConfig";


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
import { ExtraDeviceTransactionField as ExtraDeviceTransactionField_cosmos } from "../families/cosmos/deviceTransactionConfig";
import { ExtraDeviceTransactionField as ExtraDeviceTransactionField_polkadot } from "../families/polkadot/deviceTransactionConfig";
import { ExtraDeviceTransactionField as ExtraDeviceTransactionField_stellar } from "../families/stellar/deviceTransactionConfig";
import { ExtraDeviceTransactionField as ExtraDeviceTransactionField_tezos } from "../families/tezos/deviceTransactionConfig";
import { ExtraDeviceTransactionField as ExtraDeviceTransactionField_tron } from "../families/tron/deviceTransactionConfig";
export type ExtraDeviceTransactionField =
| ExtraDeviceTransactionField_cosmos
| ExtraDeviceTransactionField_polkadot
| ExtraDeviceTransactionField_stellar
| ExtraDeviceTransactionField_tezos
| ExtraDeviceTransactionField_tron
