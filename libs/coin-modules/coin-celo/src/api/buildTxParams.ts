import type {
  BufferTxData,
  MemoNotSupported,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";
import { buildCeloTxParams, type CeloTxParams } from "./buildCeloTxParams";
import { buildStakingTxParams } from "./buildStakingTxParams";
import { isCeloStakingIntent } from "./stakingIntent";
import type { CeloConfigInfo } from "../config";

/**
 * Routes a transaction intent to the right params builder: staking intents go to
 * `buildStakingTxParams` (LockedGold/Election calldata), everything else to
 * `buildCeloTxParams` (native/token send). Both `craftTransaction` and
 * `estimateFees` funnel through here so staking and send share the exact same
 * gas/nonce/serialize/CIP-64 pipeline.
 */
export const buildTxParams = async (
  config: CeloConfigInfo,
  intent: TransactionIntent<MemoNotSupported, BufferTxData>,
  feeCurrency?: `0x${string}`,
): Promise<CeloTxParams> =>
  isCeloStakingIntent(intent)
    ? buildStakingTxParams(config, intent, feeCurrency)
    : buildCeloTxParams(intent, feeCurrency);
