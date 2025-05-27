import {
  EntryFunctionPayloadResponse,
  Event,
  InputEntryFunctionData,
  MoveResource,
  WriteSetChange,
  WriteSetChangeWriteResource,
} from "@aptos-labs/ts-sdk";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import type { Account, Operation, OperationType, TokenAccount } from "@ledgerhq/types-live";
import {
  decodeTokenAccountId,
  encodeTokenAccountId,
  findSubAccountById,
  isTokenAccount,
} from "@ledgerhq/coin-framework/account/index";
import BigNumber from "bignumber.js";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import {
  APTOS_ASSET_ID,
  APTOS_FUNGIBLE_STORE,
  BATCH_TRANSFER_TYPES,
  DELEGATION_POOL_TYPES,
  OP_TYPE,
  COIN_TRANSFER_TYPES,
  FA_TRANSFER_TYPES,
  APTOS_OBJECT_CORE,
  MIN_COINS_ON_SHARES_POOL_IN_OCTAS,
  DEFAULT_GAS,
  DEFAULT_GAS_PRICE,
} from "../constants";
import type {
  AptosAccount,
  AptosFungibleoObjectCoreResourceData,
  AptosFungibleStoreResourceData,
  AptosMappedStakingPosition,
  AptosMoveResource,
  AptosStakingPosition,
  AptosTransaction,
  AptosValidator,
  Transaction,
  TransactionOptions,
} from "../types";
import { findTokenByAddressInCurrency } from "@ledgerhq/cryptoassets";
import { Unit } from "@ledgerhq/types-cryptoassets";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/formatCurrencyUnit";

const CLEAN_HEX_REGEXP = /^0x0*|^0+/;

export function isTestnet(currencyId: string): boolean {
  return getCryptoCurrencyById(currencyId).isTestnetFor ? true : false;
}

export const getMaxSendBalance = (
  account: Account,
  transaction?: Transaction,
  gas?: BigNumber,
  gasPrice?: BigNumber,
): BigNumber => {
  const tokenAccount = findSubAccountById(account, transaction?.subAccountId ?? "");
  const fromTokenAccount = tokenAccount && isTokenAccount(tokenAccount);

  gas = gas ?? BigNumber(DEFAULT_GAS);
  gasPrice = gasPrice ?? BigNumber(DEFAULT_GAS_PRICE);

  const totalGas = gas.multipliedBy(gasPrice);

  return fromTokenAccount
    ? tokenAccount.spendableBalance
    : account.spendableBalance.gt(totalGas)
      ? account.spendableBalance.minus(totalGas)
      : new BigNumber(0);
};

export function normalizeTransactionOptions(options: TransactionOptions): TransactionOptions {
  // FIXME: this is wrong. TransactionOptions is
  // {
  //     maxGasAmount: string;
  //     gasUnitPrice: string;
  //     sequenceNumber?: string;
  //     expirationTimestampSecs?: string;
  // }
  // meaning we can't return undefined in check method.
  // This method is useless, not deleting as it breaks code and this iteration is coin modularisation.
  const check = (v: any) => ((v ?? "").toString().trim() ? v : undefined);
  return {
    maxGasAmount: check(options.maxGasAmount),
    gasUnitPrice: check(options.gasUnitPrice),
  };
}

export const getBlankOperation = (
  tx: AptosTransaction,
  id: string,
): Operation<Record<string, string>> => ({
  id: "",
  hash: tx.hash,
  type: "" as OperationType,
  value: new BigNumber(0),
  fee: new BigNumber(0),
  blockHash: tx.block?.hash,
  blockHeight: tx.block?.height,
  senders: [] as string[],
  recipients: [] as string[],
  accountId: id,
  date: new Date(parseInt(tx.timestamp) / 1000),
  extra: { version: tx.version },
  transactionSequenceNumber: parseInt(tx.sequence_number),
  hasFailed: false,
});

const convertFunctionPayloadResponseToInputEntryFunctionData = (
  payload: EntryFunctionPayloadResponse,
): InputEntryFunctionData => ({
  function: payload.function,
  typeArguments: payload.type_arguments,
  functionArguments: payload.arguments,
});

export const txsToOps = (
  info: { address: string },
  id: string,
  txs: (AptosTransaction | null)[],
): [Operation[], Operation[], Operation[]] => {
  const { address } = info;
  const ops: Operation[] = [];
  const opsTokens: Operation[] = [];
  const opsStaking: Operation[] = [];

  txs.forEach(tx => {
    if (tx !== null) {
      const op: Operation = getBlankOperation(tx, id);
      op.fee = new BigNumber(tx.gas_used).multipliedBy(new BigNumber(tx.gas_unit_price));

      const payload = convertFunctionPayloadResponseToInputEntryFunctionData(
        tx.payload as EntryFunctionPayloadResponse,
      );

      const function_address = getFunctionAddress(payload);

      if (!function_address) {
        return; // skip transaction without functions in payload
      }

      const { coin_id, amount_in, amount_out, type } = getCoinAndAmounts(tx, address);
      op.value = calculateAmount(tx.sender, address, amount_in, amount_out);
      op.type =
        type !== OP_TYPE.UNKNOWN
          ? type
          : compareAddress(tx.sender, address)
            ? OP_TYPE.OUT
            : OP_TYPE.IN;
      op.senders.push(tx.sender);
      op.hasFailed = !tx.success;
      op.id = encodeOperationId(op.accountId, tx.hash, op.type);

      processRecipients(payload, address, op, function_address);

      if (op.value.isZero()) {
        // skip transaction that result no Aptos change
        op.type = OP_TYPE.UNKNOWN;
      }

      if (
        op.type === OP_TYPE.STAKE ||
        op.type === OP_TYPE.UNSTAKE ||
        op.type === OP_TYPE.WITHDRAW
      ) {
        ops.push(op);
        opsStaking.push(op);
      } else if (op.type !== OP_TYPE.UNKNOWN && coin_id !== null) {
        if (coin_id === APTOS_ASSET_ID) {
          ops.push(op);
        } else {
          const token = findTokenByAddressInCurrency(coin_id.toLowerCase(), "aptos");
          if (token !== undefined) {
            op.accountId = encodeTokenAccountId(id, token);
            opsTokens.push(op);

            if (op.type === OP_TYPE.OUT) {
              ops.push({
                ...op,
                accountId: decodeTokenAccountId(op.accountId).accountId,
                value: op.fee,
                type: "FEES",
              });
            }
          }
        }
      }
    }
  });

  return [ops, opsTokens, opsStaking];
};

export function compareAddress(addressA: string, addressB: string) {
  return (
    addressA.replace(CLEAN_HEX_REGEXP, "").toLowerCase() ===
    addressB.replace(CLEAN_HEX_REGEXP, "").toLowerCase()
  );
}

export function getFunctionAddress(payload: InputEntryFunctionData): string | undefined {
  if (payload.function) {
    const parts = payload.function.split("::");
    return parts.length === 3 && parts[0].length ? parts[0] : undefined;
  }
  return undefined;
}

export function processRecipients(
  payload: InputEntryFunctionData,
  address: string,
  op: Operation,
  function_address: string,
): void {
  // get recipients buy 3 groups
  if (
    (COIN_TRANSFER_TYPES.includes(payload.function) ||
      DELEGATION_POOL_TYPES.includes(payload.function)) &&
    payload.functionArguments &&
    payload.functionArguments.length > 0 &&
    typeof payload.functionArguments[0] === "string"
  ) {
    // 1. Transfer like functions (includes some delegation pool functions)
    op.recipients.push(payload.functionArguments[0].toString());
  } else if (
    FA_TRANSFER_TYPES.includes(payload.function) &&
    payload.functionArguments &&
    payload.functionArguments.length > 1 &&
    typeof payload.functionArguments[0] === "object" &&
    typeof payload.functionArguments[1] === "string"
  ) {
    // 1. Transfer like functions (includes some delegation pool functions)
    op.recipients.push(payload.functionArguments[1].toString());
  } else if (
    BATCH_TRANSFER_TYPES.includes(payload.function) &&
    payload.functionArguments &&
    payload.functionArguments.length > 0 &&
    Array.isArray(payload.functionArguments[0])
  ) {
    // 2. Batch function, to validate we are in the recipients list
    if (!compareAddress(op.senders[0], address)) {
      for (const recipient of payload.functionArguments[0]) {
        if (recipient && compareAddress(recipient.toString(), address)) {
          op.recipients.push(recipient.toString());
        }
      }
    }
  } else {
    // 3. other smart contracts, in this case smart contract will be treated as a recipient
    op.recipients.push(function_address);
  }
}

export function getEventCoinAddress(
  change: WriteSetChangeWriteResource,
  event: Event,
  event_name: string,
): string | null {
  const change_data = change.data;

  const mr = change_data as MoveResource<AptosMoveResource>; // -> this is data that we want to parse

  if (!(event_name in mr.data)) {
    return null;
  }

  const change_event_data = mr.data[event_name];
  if (
    change_event_data.guid.id.addr !== event.guid.account_address ||
    change_event_data.guid.id.creation_num !== event.guid.creation_number
  ) {
    return null;
  }

  const address = extractAddress(mr.type);

  return address;
}

export function getEventFAAddress(
  change: WriteSetChangeWriteResource,
  event: Event,
  _event_name: string,
): string | null {
  const change_data = change.data;

  if (change_data.type !== APTOS_FUNGIBLE_STORE) {
    return null;
  }

  const mr = change_data as MoveResource<AptosFungibleStoreResourceData>;

  if (change.address !== event.data.store) {
    return null;
  }

  return mr.data.metadata.inner;
}

export function getResourceAddress(
  tx: AptosTransaction,
  event: Event,
  event_name: string,
  getAddressProcessor: (
    change: WriteSetChangeWriteResource,
    event: Event,
    event_name: string,
  ) => string | null,
): string | null {
  for (const change of tx.changes) {
    if (isWriteSetChangeWriteResource(change)) {
      const address = getAddressProcessor(change, event, event_name);
      if (address !== null) {
        return address;
      }
    }
  }
  return null;
}

function isWriteSetChangeWriteResource(
  change: WriteSetChange,
): change is WriteSetChangeWriteResource {
  return (change as WriteSetChangeWriteResource).data !== undefined;
}

export function checkFAOwner(tx: AptosTransaction, event: Event, user_address: string): boolean {
  for (const change of tx.changes) {
    if (isWriteSetChangeWriteResource(change)) {
      const storeData = change.data as MoveResource<AptosFungibleoObjectCoreResourceData>;
      if (
        change.address == event.data.store &&
        storeData.type == APTOS_OBJECT_CORE &&
        storeData.data.owner == user_address
      ) {
        return true;
      }
    }
  }
  return false;
}

export function getCoinAndAmounts(
  tx: AptosTransaction,
  address: string,
): {
  coin_id: string | null;
  amount_in: BigNumber;
  amount_out: BigNumber;
  type: OP_TYPE;
} {
  let coin_id: string | null = null;
  let amount_in = BigNumber(0);
  let amount_out = BigNumber(0);
  let type = OP_TYPE.UNKNOWN;

  // Check if it is a staking transaction
  const stakingTx = !!tx.events.find(
    event =>
      event.type === "0x1::stake::AddStakeEvent" ||
      event.type === "0x1::stake::ReactivateStakeEvent" ||
      event.type === "0x1::stake::UnlockStakeEvent" ||
      event.type === "0x1::stake::WithdrawStakeEvent" ||
      event.type === "0x1::delegation_pool::AddStakeEvent" ||
      event.type === "0x1::delegation_pool::ReactivateStakeEvent" ||
      event.type === "0x1::delegation_pool::UnlockStakeEvent" ||
      event.type === "0x1::delegation_pool::WithdrawStakeEvent",
  );

  // Collect all events related to the address and calculate the overall amounts
  if (stakingTx) {
    tx.events.forEach(event => {
      if (
        (event.type === "0x1::stake::AddStakeEvent" ||
          event.type === "0x1::delegation_pool::AddStakeEvent") &&
        tx.sender === address &&
        !amount_out.gt(BigNumber(0))
      ) {
        coin_id = APTOS_ASSET_ID;
        type = OP_TYPE.STAKE;
        amount_out = amount_out.plus(event.data.amount_added);
      } else if (
        (event.type === "0x1::stake::ReactivateStakeEvent" ||
          event.type === "0x1::delegation_pool::ReactivateStakeEvent") &&
        tx.sender === address &&
        !amount_out.gt(BigNumber(0))
      ) {
        coin_id = APTOS_ASSET_ID;
        type = OP_TYPE.STAKE;
        amount_out = amount_out.plus(event.data.amount_added);
      } else if (
        (event.type === "0x1::stake::UnlockStakeEvent" ||
          event.type === "0x1::delegation_pool::UnlockStakeEvent") &&
        tx.sender === address &&
        !amount_in.gt(BigNumber(0))
      ) {
        coin_id = APTOS_ASSET_ID;
        type = OP_TYPE.UNSTAKE;
        amount_in = amount_in.plus(event.data.amount_added);
      } else if (
        (event.type === "0x1::stake::WithdrawStakeEvent" ||
          event.type === "0x1::delegation_pool::WithdrawStakeEvent") &&
        tx.sender === address &&
        !amount_in.gt(BigNumber(0))
      ) {
        coin_id = APTOS_ASSET_ID;
        type = OP_TYPE.WITHDRAW;
        amount_in = amount_in.plus(event.data.amount_withdrawn);
      }
    });
  } else {
    tx.events.forEach(event => {
      if (
        event.type === "0x1::coin::WithdrawEvent" &&
        compareAddress(event.guid.account_address, address)
      ) {
        coin_id = getResourceAddress(tx, event, "withdraw_events", getEventCoinAddress);
        amount_out = amount_out.plus(event.data.amount);
      } else if (
        event.type === "0x1::coin::DepositEvent" &&
        compareAddress(event.guid.account_address, address)
      ) {
        coin_id = getResourceAddress(tx, event, "deposit_events", getEventCoinAddress);
        amount_in = amount_in.plus(event.data.amount);
      } else if (
        event.type === "0x1::fungible_asset::Withdraw" &&
        checkFAOwner(tx, event, address)
      ) {
        coin_id = getResourceAddress(tx, event, "withdraw_events", getEventFAAddress);
        amount_out = amount_out.plus(event.data.amount);
      } else if (
        event.type === "0x1::fungible_asset::Deposit" &&
        checkFAOwner(tx, event, address)
      ) {
        coin_id = getResourceAddress(tx, event, "deposit_events", getEventFAAddress);
        amount_in = amount_in.plus(event.data.amount);
      } else if (event.type === "0x1::transaction_fee::FeeStatement" && tx.sender === address) {
        if (coin_id === null) coin_id = APTOS_ASSET_ID;
        if (coin_id === APTOS_ASSET_ID) {
          const fees = BigNumber(tx.gas_unit_price).times(BigNumber(tx.gas_used));
          amount_out = amount_out.plus(fees);
        }
      }
    });
  }

  return { coin_id, amount_in, amount_out, type };
}

export function calculateAmount(
  sender: string,
  address: string,
  amount_in: BigNumber,
  amount_out: BigNumber,
): BigNumber {
  const is_sender: boolean = compareAddress(sender, address);
  // LL negates the amount for SEND transactions
  // to show positive amount on the send transaction (ex: in "cancel" tx, when amount will be returned to our account)
  // we need to make it negative
  return is_sender ? amount_out.minus(amount_in) : amount_in.minus(amount_out);
}

/**
 * Extracts the address from a string like "0x1::coin::CoinStore<address::module::type>"
 * @param {string} str - The input string containing the address.
 * @returns {string | null} - The extracted address or null if not found.
 */
function extractAddress(str: string): string | null {
  const match = str.match(/<([^<>]+)>{1}$/);
  return match ? match[1] : null;
}

export function getTokenAccount(
  account: Account,
  transaction: Transaction,
): TokenAccount | undefined {
  const tokenAccount = findSubAccountById(account, transaction.subAccountId ?? "");
  const fromTokenAccount = tokenAccount && isTokenAccount(tokenAccount);
  return fromTokenAccount ? tokenAccount : undefined;
}

export const mapStakingPositions = (
  stakingPositions: AptosStakingPosition[],
  validators: AptosValidator[],
  unit: Unit,
): AptosMappedStakingPosition[] => {
  return stakingPositions.map(sp => {
    const rank = validators.findIndex(v => v.address === sp.validatorId);
    const validator = validators[rank] ?? sp;
    const formatConfig = {
      disableRounding: false,
      alwaysShowSign: false,
      showCode: true,
    };

    return {
      ...sp,
      formattedAmount: formatCurrencyUnit(unit, sp.staked, formatConfig),
      formattedPending: formatCurrencyUnit(unit, sp.pending, formatConfig),
      formattedAvailable: formatCurrencyUnit(unit, sp.available, formatConfig),
      rank,
      validator,
    };
  });
};

export const canStake = (account: AptosAccount): boolean => {
  return getMaxSendBalance(account) > MIN_COINS_ON_SHARES_POOL_IN_OCTAS;
};

export const canUnstake = (
  stakingPosition: AptosMappedStakingPosition | AptosStakingPosition,
): boolean => {
  return stakingPosition.staked.gt(0);
};

export const canWithdraw = (
  stakingPosition: AptosMappedStakingPosition | AptosStakingPosition,
): boolean => {
  return stakingPosition.available.gt(0);
};

export const canRestake = (
  stakingPosition: AptosMappedStakingPosition | AptosStakingPosition,
): boolean => {
  return stakingPosition.pending.gt(0);
};

export const getDelegationOpMaxAmount = (
  account: AptosAccount,
  validatorAddress: string,
  mode: string,
): BigNumber => {
  let maxAmount: BigNumber | undefined;

  const stakingPosition = (account.aptosResources?.stakingPositions ?? []).find(
    ({ validatorId }) => validatorId === validatorAddress,
  );

  switch (mode) {
    case "unstake":
      maxAmount = stakingPosition?.staked;
      break;
    case "withdraw":
      maxAmount = stakingPosition?.available;
      break;
    case "restake":
      maxAmount = stakingPosition?.pending;
  }

  if (maxAmount === undefined || maxAmount.lt(0)) {
    return new BigNumber(0);
  }

  return maxAmount;
};

export const formatUnlockTime = (epochSecs: string): string => {
  const unlockTime = parseInt(epochSecs, 10) * 1000; // Convert to ms
  const now = Date.now();
  const diffMs = unlockTime - now;

  if (diffMs <= 0) return "Unlocked";

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  return `${days}d ${hours}h ${minutes}m`;
};
