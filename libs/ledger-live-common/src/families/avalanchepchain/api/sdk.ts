import BigNumber from "bignumber.js";
import { getEnv } from "../../../env";
import network from "../../../network";
import { Operation, OperationType } from "../../../types";
import { encodeOperationId } from "../../../operation";
import { KeyPair as AVMKeyPair } from 'avalanche/dist/apis/avm';
import BinTools from 'avalanche/dist/utils/bintools';
import { avalancheClient } from "./client";
import type { AddressBatch } from "../types";
import { makeLRUCache } from '../../../cache';
import { HDHelper } from "../hdhelper";

const getIndexerUrl = (route: string): string =>
    `${getEnv("API_AVALANCHE_INDEXER")}${route || ""}`;

const getExplorerUrl = (route: string): string =>
  `${getEnv("API_AVALANCHE_EXPLORER_API")}${route || ""}`;

const binTools = BinTools.getInstance();

const INDEX_RANGE = 20;
const SCAN_RANGE = 80;
const P_IMPORT = "p_import";
const P_EXPORT = "p_export";
export const AVAX_HRP = "fuji"; //"fuji" for testnet

/**
 * Fetch operation list from indexer
 */
const fetchOperations = async (addresses: string[], startHeight: number) => {
  const ADDRESS_SIZE = 1024;
  const selection = addresses.slice(0, ADDRESS_SIZE);
  const remaining = addresses.slice(ADDRESS_SIZE);

  const rawAddresses = selection.map(removeChainPrefix).join(",");

  let { data } = await network({
    method: "GET",
    url: getIndexerUrl(
      `/transactions?address=${rawAddresses}&start_height=${startHeight}&limit=100`
    ),
  });

  if (remaining.length > 0) {
    const nextOperations = await fetchOperations(remaining, startHeight);
    data.push(...nextOperations);
  }

  return data;
};

/**
 * Remove the chain prefix (e.g "P-") from the address
 * @param address - "P-avax1yvkhyf0y9674p2ps41vmp9a8w427384jcu8zmn"
 * @returns avax1yvkhyf0y9674p2ps41vmp9a8w427384jcu8zmn
 */
const removeChainPrefix = (address: string) => address.split("-")[1];

const convertTransactionToOperation = (transaction, accountId): Operation => {
  const type = getOperationType(transaction.type);
  const fee = new BigNumber(transaction.fee);
  const outputIndex = transaction.type === P_IMPORT ? 0 : 1;
  let value = new BigNumber(transaction.outputs?.[outputIndex].amount);

  if (transaction.type === P_EXPORT) {
    value = value.plus(fee);
  }

  return {
    id: encodeOperationId(accountId, transaction.id, type),
    hash: transaction.id,
    type,
    value,
    fee,
    senders: transaction.inputs?.[0].addresses ?? [],
    recipients: transaction.outputs?.[0].addresses ?? [],
    blockHeight: transaction.block_height,
    blockHash: transaction.block,
    accountId,
    date: new Date(transaction.timestamp),
    extra: {},
  };
};

const getOperationType = (type: string): OperationType => {
  switch (type) {
    case P_EXPORT:
      return "OUT";
    case P_IMPORT:
      return "IN";
    default:
      return "NONE";
  }
};

export const getOperations = async (
  blockStartHeight: number,
  accountId: string
): Promise<Operation[]> => {
  const hdHelper = HDHelper.getInstance();
  const addresses = hdHelper.getAllDerivedAddresses();

  let operations: Operation[] = await fetchOperations(
    addresses,
    blockStartHeight
  );

  const pChainOperations = operations.filter(getPChainOperations);
  return pChainOperations.map((o) =>
    convertTransactionToOperation(o, accountId)
  );
};

const getPChainOperations = ({ type }) =>
  type === P_IMPORT || type === P_EXPORT;

export const getAccount = async () => {
  const hdHelper = HDHelper.getInstance();
  const { available, locked, lockedStakeable, multisig } =
    await hdHelper.fetchBalances();
  const stakedBalance = await hdHelper.fetchStake();
  const balance = available.plus(locked).plus(lockedStakeable).plus(multisig);

  return {
    balance,
    stakedBalance,
  };
};

export const getDelegations = async () => {
  let allDelegators: any = [];
  const validators = await getValidators();

  for (let i = 0; i < validators.length; i++) {
    let validator = validators[i];
    if (validator.delegators == null) continue;
    allDelegators.push(...validator.delegators);
  }

  return getUserDelegations(allDelegators);
};

const getUserDelegations = (delegators) => {
  const hdHelper = HDHelper.getInstance();

  const userAddresses = hdHelper.getAllDerivedAddresses();

  let userDelegations = delegators.filter((d) => {
    let rewardAddresses = d.rewardOwner.addresses;
    let filteredByUser = rewardAddresses.filter((address) => {
      return userAddresses.includes(address);
    });

    return filteredByUser.length > 0;
  });

  userDelegations.sort((a, b) => {
    let startA = parseInt(a.startTime);
    let startB = parseInt(b.startTime);
    return startA - startB;
  });

  return userDelegations;
};

// export const getValidators = makeLRUCache(async () => {
//   const { validators } = (await avalancheClient()
//     .PChain()
//     .getCurrentValidators()) as any;
//   return validators;
// });

export const getValidators = async () => {
  const { validators } = (await avalancheClient()
    .PChain()
    .getCurrentValidators()) as any;
  return validators;
};

export const getAddressChains = async (addresses: string[]) => {
  const rawAddresses = addresses.map(removeChainPrefix);

  let { data } = await network({
    method: "POST",
    data: {
      address: rawAddresses,
      disableCount: ["1"],
    },
    url: getExplorerUrl(`/v2/addressChains`),
  });

  return data.addressChains;
};
  

//TODO: replace this with HdHelper
//OR, see walletPlatformBalance in assets.ts in avalanche-wallet
//Should be able to easily calculate all P chain balances
//To get stake amount, see getStakeForAddresses in utxo_helper.ts
//Will need this info for "Staking info Dashboard" ticket

/**
 * @param hdKey 
 * @returns Total balance of this wallet's P-chain addresses
 */
// export const fetchBalances = async (hdKey) => {

//     let balanceTotal = new BigNumber(0);
//     const assetID = await avalancheClient().PChain().getAVAXAssetID();

//     const batchFunction = async (batch: AddressBatch) => {
//         for (const [_, utxoids] of Object.entries<{}>(batch.utxoset.addressUTXOs)) {
//             let balance = new BigNumber(0);

//             for (const utxoid of Object.keys(utxoids)) {
//                 const utxo = batch.utxoset.utxos[utxoid];

//                 if (utxo.getAssetID().equals(assetID)) {
//                     balance = balance.plus(utxo.getOutput().getAmount());
//                 }
//                 balanceTotal = balanceTotal.plus(balance);
//             }
//         }
//     }

//     await getUsedKeys(hdKey, batchFunction);

//     return balanceTotal;
// }

//walletPlatformBalance
// export const getPChainBalances = async (publicKey, chainCode) => {
//     const balances = {
//         available: new BN(0),
//         locked: new BN(0),
//         lockedStakeable: new BN(0),
//         multisig: new BN(0),
//     };

//     const hdHelper = HDHelper.getInstance(publicKey, chainCode);
//     const utxoSet: UTXOSet = await hdHelper.fetchUTXOs();
//     const now = UnixNow();

//     const utxos = utxoSet.getAllUTXOs();

//     for (let n = 0; n < utxos.length; n++) {
//         const utxo = utxos[n];
//         const utxoOut = utxo.getOutput();
//         const outId = utxoOut.getOutputID();
//         const threshold = utxoOut.getThreshold();

//         if (threshold > 1) {
//             balances.multisig.iadd((utxoOut as AmountOutput).getAmount());
//             continue;
//         }

//         const isStakeableLock = outId === PlatformVMConstants.STAKEABLELOCKOUTID;

//         let locktime;
//         if (isStakeableLock) {
//             locktime = (utxoOut as StakeableLockOut).getStakeableLocktime();
//         } else {
//             locktime = (utxoOut as AmountOutput).getLocktime();
//         }

//         if (locktime.lte(now)) {
//             balances.available.iadd((utxoOut as AmountOutput).getAmount());
//         }
//         else if (!isStakeableLock) {
//             balances.locked.iadd((utxoOut as AmountOutput).getAmount());
//         }
//         else if (isStakeableLock) {
//             balances.lockedStakeable.iadd((utxoOut as AmountOutput).getAmount());
//         }
//     }

//     return {
//         available: new BigNumber(balances.available.toString()),
//         locked: new BigNumber(balances.locked.toString()),
//         lockedStakeable: new BigNumber(balances.lockedStakeable.toString()),
//         multisig: new BigNumber(balances.multisig.toString()))
//     };
// }

/**
 * Liberally inspired by avalanche-wallet-cli
 * Traverses the wallet, finding all used keys.
 * Batching 40 used keys at a time, hit the node to retrieve each key's UTXOs.
 * Then, call the batchFunction on that group of 40 used keys.
 * @param hdKey 
 * @param batchFunction 
 */
const getUsedKeys = async (hdKey, batchFunction) => {
    let allAddressesAreUnused = false;
    let index = 0;

    while (!allAddressesAreUnused || index < SCAN_RANGE) {
        const batch: AddressBatch = {
            nonChange: { addresses: [], pkhs: [] },
            change: { addresses: [], pkhs: [] },
            utxoset: {}
        }

        for (let i = 0; i < INDEX_RANGE; i++) {
            const child = hdKey.deriveChild(0).deriveChild(index + i);
            const changeChild = hdKey.deriveChild(1).deriveChild(index + i);

            const publicKeyHash = AVMKeyPair.addressFromPublicKey(child.publicKey);
            const changePublicKeyHash = AVMKeyPair.addressFromPublicKey(changeChild.publicKey);
            const address = binTools.addressToString(AVAX_HRP, "P", publicKeyHash);
            const changeAddress = binTools.addressToString(AVAX_HRP, "P", changePublicKeyHash);

            batch.nonChange.pkhs.push(publicKeyHash);
            batch.change.pkhs.push(changePublicKeyHash);
            batch.nonChange.addresses.push(address);
            batch.change.addresses.push(changeAddress);
        }

        const batchedAddresses = batch.nonChange.addresses.concat(batch.change.addresses);

        const pchain = avalancheClient().PChain();

        let { utxos } = await pchain.getUTXOs(batchedAddresses);
        batch.utxoset = utxos;

        await batchFunction(batch);

        index += INDEX_RANGE;
        allAddressesAreUnused = batch.utxoset.getAllUTXOs().length === 0;
    }
};