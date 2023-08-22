import Prando from "prando";
import { BigNumber } from "bignumber.js";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account } from "@ledgerhq/types-live";
import type { GenAccountOptions } from "@ledgerhq/coin-framework/mocks/account";
import {
  genAccount as genAccountCommon,
  genOperation,
  ensureNoNegative,
} from "@ledgerhq/coin-framework/mocks/account";
import { getAccountBridge } from "../bridge";
import perFamilyMock from "../generated/mock";
import { CosmosAccount } from "../families/cosmos/types";
import { BitcoinAccount } from "../families/bitcoin/types";
import { PolkadotAccount } from "@ledgerhq/coin-polkadot/types";
import { TezosAccount } from "../families/tezos/types";
import { TronAccount } from "../families/tron/types";
import { CardanoAccount } from "../families/cardano/types";

/**
 * @memberof mock/account
 */
export function genAddingOperationsInAccount(
  account: Account,
  count: number,
  seed: number | string,
): Account {
  const rng = new Prando(seed);
  const copy: Account = { ...account };
  copy.operations = Array(count)
    .fill(null)
    .reduce(ops => {
      const op = genOperation(copy, copy, ops, rng);
      return ops.concat(op);
    }, copy.operations);
  copy.spendableBalance = copy.balance = ensureNoNegative(copy.operations);
  const perFamilyOperation = perFamilyMock[account.currency.id];
  const postSyncAccount = perFamilyOperation && perFamilyOperation.postSyncAccount;
  if (postSyncAccount) postSyncAccount(copy);
  return copy;
}

export function genAccount(id: number | string, opts: GenAccountOptions = {}): Account {
  return genAccountCommon(
    id,
    opts,
    (account: Account, currency: CryptoCurrency, address: string) => {
      switch (currency.family) {
        case "cosmos":
          (account as CosmosAccount).cosmosResources = {
            // TODO variation in these
            delegations: [],
            redelegations: [],
            unbondings: [],
            delegatedBalance: new BigNumber(0),
            pendingRewardsBalance: new BigNumber(0),
            unbondingBalance: new BigNumber(0),
            withdrawAddress: address,
          };
          break;
        case "bitcoin":
          (account as BitcoinAccount).bitcoinResources = {
            utxos: [],
            walletAccount: undefined,
          };
          break;
        case "polkadot":
          (account as PolkadotAccount).polkadotResources = {
            stash: null,
            controller: null,
            nonce: 0,
            lockedBalance: new BigNumber(0),
            unlockingBalance: new BigNumber(0),
            unlockedBalance: new BigNumber(0),
            unlockings: [],
            nominations: [],
            numSlashingSpans: 0,
          };
          break;
        case "tezos":
          (account as TezosAccount).tezosResources = {
            revealed: true,
            counter: 0,
          };
          break;
        case "tron":
          // TODO variation in these. you could use the account.name as a way to split cases
          (account as TronAccount).tronResources = {
            frozen: {
              bandwidth: null,
              energy: null,
            },
            delegatedFrozen: {
              bandwidth: null,
              energy: null,
            },
            votes: [],
            tronPower: 0,
            energy: BigNumber(0),
            bandwidth: {
              freeUsed: BigNumber(0),
              freeLimit: BigNumber(1),
              gainedUsed: BigNumber(0),
              gainedLimit: BigNumber(0),
            },
            unwithdrawnReward: BigNumber(0),
            lastWithdrawnRewardDate: null,
            lastVotedDate: null,
            cacheTransactionInfoById: {},
          };
          break;
        case "cardano":
          (account as CardanoAccount).cardanoResources = {
            delegation: {
              status: true,
              poolId: "45",
              ticker: "ADA",
              name: "Cardano",
              rewards: new BigNumber(42),
            },
            externalCredentials: [],
            internalCredentials: [],
            utxos: [],
            protocolParams: {
              minFeeA: "",
              minFeeB: "",
              stakeKeyDeposit: "",
              lovelacePerUtxoWord: "",
              collateralPercent: "",
              priceMem: "",
              priceSteps: "",
              languageView: {
                PlutusScriptV1: {
                  "sha2_256-memory-arguments": 4,
                  "equalsString-cpu-arguments-constant": 1000,
                  "cekDelayCost-exBudgetMemory": 100,
                  "lessThanEqualsByteString-cpu-arguments-intercept": 103599,
                  "divideInteger-memory-arguments-minimum": 1,
                  "appendByteString-cpu-arguments-slope": 621,
                  "blake2b-cpu-arguments-slope": 29175,
                  "iData-cpu-arguments": 150000,
                  "encodeUtf8-cpu-arguments-slope": 1000,
                  "unBData-cpu-arguments": 150000,
                  "multiplyInteger-cpu-arguments-intercept": 61516,
                  "cekConstCost-exBudgetMemory": 100,
                  "nullList-cpu-arguments": 150000,
                  "equalsString-cpu-arguments-intercept": 150000,
                  "trace-cpu-arguments": 150000,
                  "mkNilData-memory-arguments": 32,
                  "lengthOfByteString-cpu-arguments": 150000,
                  "cekBuiltinCost-exBudgetCPU": 29773,
                  "bData-cpu-arguments": 150000,
                  "subtractInteger-cpu-arguments-slope": 0,
                  "unIData-cpu-arguments": 150000,
                  "consByteString-memory-arguments-intercept": 0,
                  "divideInteger-memory-arguments-slope": 1,
                  "divideInteger-cpu-arguments-model-arguments-slope": 118,
                  "listData-cpu-arguments": 150000,
                  "headList-cpu-arguments": 150000,
                  "chooseData-memory-arguments": 32,
                  "equalsInteger-cpu-arguments-intercept": 136542,
                  "sha3_256-cpu-arguments-slope": 82363,
                  "sliceByteString-cpu-arguments-slope": 5000,
                  "unMapData-cpu-arguments": 150000,
                  "lessThanInteger-cpu-arguments-intercept": 179690,
                  "mkCons-cpu-arguments": 150000,
                  "appendString-memory-arguments-intercept": 0,
                  "modInteger-cpu-arguments-model-arguments-slope": 118,
                  "ifThenElse-cpu-arguments": 1,
                  "mkNilPairData-cpu-arguments": 150000,
                  "lessThanEqualsInteger-cpu-arguments-intercept": 145276,
                  "addInteger-memory-arguments-slope": 1,
                  "chooseList-memory-arguments": 32,
                  "constrData-memory-arguments": 32,
                  "decodeUtf8-cpu-arguments-intercept": 150000,
                  "equalsData-memory-arguments": 1,
                  "subtractInteger-memory-arguments-slope": 1,
                  "appendByteString-memory-arguments-intercept": 0,
                  "lengthOfByteString-memory-arguments": 4,
                  "headList-memory-arguments": 32,
                  "listData-memory-arguments": 32,
                  "consByteString-cpu-arguments-intercept": 150000,
                  "unIData-memory-arguments": 32,
                  "remainderInteger-memory-arguments-minimum": 1,
                  "bData-memory-arguments": 32,
                  "lessThanByteString-cpu-arguments-slope": 248,
                  "encodeUtf8-memory-arguments-intercept": 0,
                  "cekStartupCost-exBudgetCPU": 100,
                  "multiplyInteger-memory-arguments-intercept": 0,
                  "unListData-memory-arguments": 32,
                  "remainderInteger-cpu-arguments-model-arguments-slope": 118,
                  "cekVarCost-exBudgetCPU": 29773,
                  "remainderInteger-memory-arguments-slope": 1,
                  "cekForceCost-exBudgetCPU": 29773,
                  "sha2_256-cpu-arguments-slope": 29175,
                  "equalsInteger-memory-arguments": 1,
                  "indexByteString-memory-arguments": 1,
                  "addInteger-memory-arguments-intercept": 1,
                  "chooseUnit-cpu-arguments": 150000,
                  "sndPair-cpu-arguments": 150000,
                  "cekLamCost-exBudgetCPU": 29773,
                  "fstPair-cpu-arguments": 150000,
                  "quotientInteger-memory-arguments-minimum": 1,
                  "decodeUtf8-cpu-arguments-slope": 1000,
                  "lessThanInteger-memory-arguments": 1,
                  "lessThanEqualsInteger-cpu-arguments-slope": 1366,
                  "fstPair-memory-arguments": 32,
                  "modInteger-memory-arguments-intercept": 0,
                  "unConstrData-cpu-arguments": 150000,
                  "lessThanEqualsInteger-memory-arguments": 1,
                  "chooseUnit-memory-arguments": 32,
                  "sndPair-memory-arguments": 32,
                  "addInteger-cpu-arguments-intercept": 197209,
                  "decodeUtf8-memory-arguments-slope": 8,
                  "equalsData-cpu-arguments-intercept": 150000,
                  "mapData-cpu-arguments": 150000,
                  "mkPairData-cpu-arguments": 150000,
                  "quotientInteger-cpu-arguments-constant": 148000,
                  "consByteString-memory-arguments-slope": 1,
                  "cekVarCost-exBudgetMemory": 100,
                  "indexByteString-cpu-arguments": 150000,
                  "unListData-cpu-arguments": 150000,
                  "equalsInteger-cpu-arguments-slope": 1326,
                  "cekStartupCost-exBudgetMemory": 100,
                  "subtractInteger-cpu-arguments-intercept": 197209,
                  "divideInteger-cpu-arguments-model-arguments-intercept": 425507,
                  "divideInteger-memory-arguments-intercept": 0,
                  "cekForceCost-exBudgetMemory": 100,
                  "blake2b-cpu-arguments-intercept": 2477736,
                  "remainderInteger-cpu-arguments-constant": 148000,
                  "tailList-cpu-arguments": 150000,
                  "encodeUtf8-cpu-arguments-intercept": 150000,
                  "equalsString-cpu-arguments-slope": 1000,
                  "lessThanByteString-memory-arguments": 1,
                  "multiplyInteger-cpu-arguments-slope": 11218,
                  "appendByteString-cpu-arguments-intercept": 396231,
                  "lessThanEqualsByteString-cpu-arguments-slope": 248,
                  "modInteger-memory-arguments-slope": 1,
                  "addInteger-cpu-arguments-slope": 0,
                  "equalsData-cpu-arguments-slope": 10000,
                  "decodeUtf8-memory-arguments-intercept": 0,
                  "chooseList-cpu-arguments": 150000,
                  "constrData-cpu-arguments": 150000,
                  "equalsByteString-memory-arguments": 1,
                  "cekApplyCost-exBudgetCPU": 29773,
                  "quotientInteger-memory-arguments-slope": 1,
                  "verifySignature-cpu-arguments-intercept": 3345831,
                  "unMapData-memory-arguments": 32,
                  "mkCons-memory-arguments": 32,
                  "sliceByteString-memory-arguments-slope": 1,
                  "sha3_256-memory-arguments": 4,
                  "ifThenElse-memory-arguments": 1,
                  "mkNilPairData-memory-arguments": 32,
                  "equalsByteString-cpu-arguments-slope": 247,
                  "appendString-cpu-arguments-intercept": 150000,
                  "quotientInteger-cpu-arguments-model-arguments-slope": 118,
                  "cekApplyCost-exBudgetMemory": 100,
                  "equalsString-memory-arguments": 1,
                  "multiplyInteger-memory-arguments-slope": 1,
                  "cekBuiltinCost-exBudgetMemory": 100,
                  "remainderInteger-memory-arguments-intercept": 0,
                  "sha2_256-cpu-arguments-intercept": 2477736,
                  "remainderInteger-cpu-arguments-model-arguments-intercept": 425507,
                  "lessThanEqualsByteString-memory-arguments": 1,
                  "tailList-memory-arguments": 32,
                  "mkNilData-cpu-arguments": 150000,
                  "chooseData-cpu-arguments": 150000,
                  "unBData-memory-arguments": 32,
                  "blake2b-memory-arguments": 4,
                  "iData-memory-arguments": 32,
                  "nullList-memory-arguments": 32,
                  "cekDelayCost-exBudgetCPU": 29773,
                  "subtractInteger-memory-arguments-intercept": 1,
                  "lessThanByteString-cpu-arguments-intercept": 103599,
                  "consByteString-cpu-arguments-slope": 1000,
                  "appendByteString-memory-arguments-slope": 1,
                  "trace-memory-arguments": 32,
                  "divideInteger-cpu-arguments-constant": 148000,
                  "cekConstCost-exBudgetCPU": 29773,
                  "encodeUtf8-memory-arguments-slope": 8,
                  "quotientInteger-cpu-arguments-model-arguments-intercept": 425507,
                  "mapData-memory-arguments": 32,
                  "appendString-cpu-arguments-slope": 1000,
                  "modInteger-cpu-arguments-constant": 148000,
                  "verifySignature-cpu-arguments-slope": 1,
                  "unConstrData-memory-arguments": 32,
                  "quotientInteger-memory-arguments-intercept": 0,
                  "equalsByteString-cpu-arguments-constant": 150000,
                  "sliceByteString-memory-arguments-intercept": 0,
                  "mkPairData-memory-arguments": 32,
                  "equalsByteString-cpu-arguments-intercept": 112536,
                  "appendString-memory-arguments-slope": 1,
                  "lessThanInteger-cpu-arguments-slope": 497,
                  "modInteger-cpu-arguments-model-arguments-intercept": 425507,
                  "modInteger-memory-arguments-minimum": 1,
                  "sha3_256-cpu-arguments-intercept": 0,
                  "verifySignature-memory-arguments": 1,
                  "cekLamCost-exBudgetMemory": 100,
                  "sliceByteString-cpu-arguments-intercept": 150000,
                },
              },
            },
          };
          break;
        default: {
          try {
            const bridge = getAccountBridge(account);
            const initAccount = bridge.initAccount;
            if (initAccount) {
              initAccount(account);
            }
          } catch (e: any) {
            // to fix /src/__tests__/cross.ts, skip bridge error if there is no bridge in such currency
          }
        }
      }
    },
    (account: Account, currency: CryptoCurrency, rng: Prando) => {
      const perFamilyOperation = perFamilyMock[currency.id];
      const genAccountEnhanceOperations =
        perFamilyOperation && perFamilyOperation.genAccountEnhanceOperations;
      if (genAccountEnhanceOperations) {
        genAccountEnhanceOperations(account, rng);
      }
    },
  );
}
