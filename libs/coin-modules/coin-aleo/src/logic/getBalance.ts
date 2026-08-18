import invariant from "invariant";
import BigNumber from "bignumber.js";
import type { Balance } from "@ledgerhq/coin-module-framework/api/types";
import { promiseAllBatched } from "@ledgerhq/coin-module-framework/promises";
import { PROGRAM_ID } from "../constants";
import { apiClient } from "../network/api";
import {
  fetchAccountTransactionsFromHeight,
  fetchAllOwnedRecords,
  fetchAllTokens,
  getRecordScannerStatusOrThrow,
  sumUnspentRecords,
} from "../network/utils";
import type { AleoContext, AleoPrivateRecord, AleoTokenType } from "../types";
import { getPublicBalance } from "./getPublicBalance";
import { classifyAleoTokenType, isTokenRecord, parseAmount, resolvePrivacyContext } from "./utils";

export async function getBalance(context: AleoContext, address: string): Promise<Balance[]> {
  const config = await context.config();
  const privacyContext = resolvePrivacyContext(context);

  const [publicBalance, publicDetails, status, allUnspentRecords, allTokens] = await Promise.all([
    getPublicBalance(config, address),
    fetchAccountTransactionsFromHeight({
      config,
      address,
      fetchAllPages: true,
      minBlockHeight: 0,
    }),
    getRecordScannerStatusOrThrow(config, privacyContext.provableId),
    fetchAllOwnedRecords({
      config,
      uuid: privacyContext.provableId,
      unspent: true,
      // empty arrays opt out of the credits.aleo-only filter, returning records for all programs
      programs: [],
      functions: [],
    }),
    fetchAllTokens({ config }),
  ]);

  const tokenTypeByProgramName = new Map<string, AleoTokenType>(
    allTokens.map(token => [token.program_name, classifyAleoTokenType(token)]),
  );

  const publicTokenProgramIds = new Set(
    publicDetails.transactions
      .map(tx => tx.program_id)
      .filter(programId => programId !== PROGRAM_ID.CREDITS),
  );
  const maxSyncedBlockHeight = status.synced_up_to;

  const privateNativeRecords = allUnspentRecords.filter(
    record => record.program_name === PROGRAM_ID.CREDITS,
  );
  const privateTokenRecords = allUnspentRecords.filter(isTokenRecord);

  const sumPrivate = (records: AleoPrivateRecord[]): Promise<BigNumber> =>
    sumUnspentRecords({
      config,
      viewKey: privacyContext.viewKey,
      records,
      ...(typeof maxSyncedBlockHeight === "number" && { maxBlockHeight: maxSyncedBlockHeight }),
    });

  const privateNativeSum = await sumPrivate(privateNativeRecords);

  const tokenProgramIds = [
    ...new Set([
      ...publicTokenProgramIds,
      ...privateTokenRecords.map(record => record.program_name),
    ]),
  ].filter(programId => tokenTypeByProgramName.has(programId));

  const tokenBalances: Balance[] = await promiseAllBatched(4, tokenProgramIds, async programId => {
    const publicPart = parseAmount(await apiClient.getTokenBalance(config, programId, address));
    const privatePart = await sumPrivate(
      privateTokenRecords.filter(record => record.program_name === programId),
    );
    const type = tokenTypeByProgramName.get(programId);
    invariant(typeof type === "string", "aleo: guard for token type");

    return {
      value: BigInt(publicPart.plus(privatePart).toFixed(0)),
      asset: { type, assetReference: programId },
    };
  });

  const publicNativeValue = publicBalance[0]?.value ?? 0n;
  const nativeValue = publicNativeValue + BigInt(privateNativeSum.toFixed(0));

  return [{ value: nativeValue, asset: { type: "native" } }, ...tokenBalances];
}
