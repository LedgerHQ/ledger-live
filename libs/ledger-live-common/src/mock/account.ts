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

/**
 * @memberof mock/account
 */
export function genAddingOperationsInAccount(
  account: Account,
  count: number,
  seed: number | string
): Account {
  const rng = new Prando(seed);
  const copy: Account = { ...account };
  copy.operations = Array(count)
    .fill(null)
    .reduce((ops) => {
      const op = genOperation(copy, copy, ops, rng);
      return ops.concat(op);
    }, copy.operations);
  copy.spendableBalance = copy.balance = ensureNoNegative(copy.operations);
  const perFamilyOperation = perFamilyMock[account.currency.id];
  const postSyncAccount =
    perFamilyOperation && perFamilyOperation.postSyncAccount;
  if (postSyncAccount) postSyncAccount(copy);
  return copy;
}

export function genAccount(
  id: number | string,
  opts: GenAccountOptions = {}
): Account {
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
    }
  );
}
