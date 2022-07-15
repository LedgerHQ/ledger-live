import {
  CARDANO_COIN_TYPE,
  CARDANO_PURPOSE,
  MEMO_LABEL,
  STAKING_ADDRESS_INDEX,
  TTL_GAP,
} from "./constants";

import {
  utils as TyphonUtils,
  types as TyphonTypes,
  address as TyphonAddress,
} from "@stricahq/typhonjs";
import {
  AddressType,
  AssetGroup,
  TxInput,
  TxOutput,
  TxOutputDestination,
  TxOutputDestinationType,
} from "@cardano-foundation/ledgerjs-hw-app-cardano";
import { str_to_path } from "@cardano-foundation/ledgerjs-hw-app-cardano/dist/utils";
import {
  BipPath,
  PaymentChain,
  PaymentCredential,
  StakeChain,
  StakeCredential,
  Token,
} from "./types";
import { Bip32PublicKey } from "@stricahq/bip32ed25519";
import BigNumber from "bignumber.js";
import { getNetworkParameters } from "./networks";
import { CryptoCurrency, OperationType } from "../../types";
import groupBy from "lodash/groupBy";
import { APITransaction } from "./api/api-types";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import ShelleyTypeAddress from "@stricahq/typhonjs/dist/address/ShelleyTypeAddress";

/**
 *  returns BipPath object with account, chain and index field for cardano
 *
 * @param {string} path
 */
export function getBipPathFromString(path: string): BipPath {
  const regEx = new RegExp(
    `^${CARDANO_PURPOSE}'/${CARDANO_COIN_TYPE}'/(\\d*)'/([012])/(\\d*)`
  );
  const result = path.match(regEx);
  if (result == null) {
    throw new Error("Invalid derivation path");
  }
  return getBipPath({
    account: parseInt(result[1]),
    chain: parseInt(result[2]),
    index: parseInt(result[3]),
  });
}

/**
 * returns complete bipPath with purpose, coin, account, chain and index for cardano
 */
export function getBipPath({
  account,
  chain,
  index,
}: {
  account: number;
  chain: PaymentChain | StakeChain;
  index: number;
}): BipPath {
  return {
    purpose: CARDANO_PURPOSE,
    coin: CARDANO_COIN_TYPE,
    account,
    chain,
    index,
  };
}

/**
 * returns bipPathString from account, chain and index for cardano
 */
export function getBipPathString({
  account,
  chain,
  index,
}: {
  account: number;
  chain: number;
  index: number;
}): string {
  return `${CARDANO_PURPOSE}'/${CARDANO_COIN_TYPE}'/${account}'/${chain}/${index}`;
}

export function getExtendedPublicKeyFromHex(keyHex: string): Bip32PublicKey {
  return Bip32PublicKey.fromBytes(Buffer.from(keyHex, "hex"));
}

export function getCredentialKey(
  accountKey: Bip32PublicKey,
  path: BipPath
): { key: string; path: BipPath } {
  const keyBytes = accountKey
    .derive(path.chain)
    .derive(path.index)
    .toPublicKey()
    .hash();
  const pubKeyHex = keyBytes.toString("hex");
  return {
    key: pubKeyHex,
    path,
  };
}

/**
 * returns cardano base address by paymentKey and stakeKey
 */
export function getBaseAddress({
  networkId,
  paymentCred,
  stakeCred,
}: {
  networkId: number;
  paymentCred: PaymentCredential;
  stakeCred: StakeCredential;
}): TyphonAddress.BaseAddress {
  const paymentCredential: TyphonTypes.HashCredential = {
    hash: paymentCred.key,
    type: TyphonTypes.HashType.ADDRESS,
    bipPath: paymentCred.path,
  };

  const stakeCredential: TyphonTypes.HashCredential = {
    hash: stakeCred.key,
    type: TyphonTypes.HashType.ADDRESS,
    bipPath: stakeCred.path,
  };
  return new TyphonAddress.BaseAddress(
    networkId,
    paymentCredential,
    stakeCredential
  );
}

/**
 * Returns true if address is a valid
 *
 * @param {string} address
 */
export const isValidAddress = (address: string, networkId: number): boolean => {
  if (!address) return false;

  try {
    const cardanoAddress = TyphonUtils.getAddressFromBech32(address);
    if (cardanoAddress instanceof ShelleyTypeAddress) {
      const addressNetworkId = Number(
        cardanoAddress.getHex().toLowerCase().charAt(1)
      );
      if (addressNetworkId !== networkId) {
        return false;
      }
    }
  } catch (error) {
    return false;
  }
  return true;
};

export const getAbsoluteSlot = function (
  networkName: string,
  time: Date
): number {
  const networkParams = getNetworkParameters(networkName);
  const byronChainEndSlots =
    networkParams.shelleyStartEpoch * networkParams.byronSlotsPerEpoch;
  const byronChainEndTime =
    byronChainEndSlots * networkParams.byronSlotDuration;

  const shelleyChainTime =
    time.getTime() - networkParams.chainStartTime - byronChainEndTime;
  const shelleyChainSlots = Math.floor(
    shelleyChainTime / networkParams.shelleySlotDuration
  );
  return byronChainEndSlots + shelleyChainSlots;
};

/**
 * Returns the time to live for transaction
 *
 * @returns {number}
 */
export function getTTL(networkName: string): number {
  return getAbsoluteSlot(networkName, new Date()) + TTL_GAP;
}

export function getEpoch(networkName: string, time: Date): number {
  const networkParams = getNetworkParameters(networkName);
  const chainTime = time.getTime() - networkParams.chainStartTime;
  const epoch = Math.floor(
    chainTime /
      (networkParams.shelleySlotsPerEpoch * networkParams.shelleySlotDuration)
  );
  return epoch;
}

export function mergeTokens(
  tokens: Array<TyphonTypes.Token>
): Array<TyphonTypes.Token> {
  return Object.values(
    groupBy(tokens, (t) => `${t.policyId}${t.assetName}`)
  ).map((similarTokens) => ({
    policyId: similarTokens[0].policyId,
    assetName: similarTokens[0].assetName,
    amount: similarTokens.reduce(
      (total, token) => total.plus(token.amount),
      new BigNumber(0)
    ),
  }));
}

/**
 * @param { Array<TyphonTypes.Token> } b
 * @param { Array<TyphonTypes.Token> } a
 * @returns a - b
 */
export function getTokenDiff(
  a: Array<TyphonTypes.Token>,
  b: Array<TyphonTypes.Token>
): Array<TyphonTypes.Token> {
  return mergeTokens(
    a.concat(b.map((t) => ({ ...t, amount: t.amount.negated() })))
  ).filter((t) => !t.amount.eq(0));
}

/**
 * returns the formatted transactionOutput for ledger cardano app
 *
 * @param output
 * @param accountIndex
 * @returns {TxOutput}
 */
export function prepareLedgerOutput(
  output: TyphonTypes.Output,
  accountIndex: number
): TxOutput {
  const isByronAddress = output.address instanceof TyphonAddress.ByronAddress;
  let isDeviceOwnedAddress = false;
  let destination: TxOutputDestination;

  if (!isByronAddress) {
    const address = output.address as TyphonTypes.ShelleyAddress;
    isDeviceOwnedAddress =
      address.paymentCredential &&
      address.paymentCredential.type === TyphonTypes.HashType.ADDRESS &&
      address.paymentCredential.bipPath !== undefined;
  }

  if (isDeviceOwnedAddress) {
    const address = output.address as TyphonAddress.BaseAddress;

    const paymentKeyPath = (
      address.paymentCredential as TyphonTypes.HashCredential
    ).bipPath as TyphonTypes.BipPath;
    const stakingKeyPath = (
      address.stakeCredential as TyphonTypes.HashCredential
    ).bipPath as TyphonTypes.BipPath;

    const paymentKeyPathString = getBipPathString({
      account: accountIndex,
      chain: paymentKeyPath.chain,
      index: paymentKeyPath.index,
    });
    const stakingKeyPathString = getBipPathString({
      account: accountIndex,
      chain: stakingKeyPath.chain,
      index: stakingKeyPath.index,
    });

    destination = {
      type: TxOutputDestinationType.DEVICE_OWNED,
      params: {
        type: AddressType.BASE_PAYMENT_KEY_STAKE_KEY,
        params: {
          spendingPath: str_to_path(paymentKeyPathString),
          stakingPath: str_to_path(stakingKeyPathString),
        },
      },
    };
  } else {
    const address = output.address;
    destination = {
      type: TxOutputDestinationType.THIRD_PARTY,
      params: {
        addressHex: address.getHex(),
      },
    };
  }

  const tokenBundle: Array<AssetGroup> = Object.values(
    groupBy(output.tokens, ({ policyId }) => policyId)
  ).map((tokens) => ({
    policyIdHex: tokens[0].policyId,
    tokens: tokens.map((token) => ({
      assetNameHex: token.assetName,
      amount: token.amount.toString(),
    })),
  }));

  return {
    amount: output.amount.toString(),
    destination,
    tokenBundle,
  };
}

/**
 * returns the formatted transactionInput for ledger cardano app
 *
 * @param {TyphonTypes.Input} input
 * @param {number} accountIndex
 * @returns {TxInput}
 */
export function prepareLedgerInput(
  input: TyphonTypes.Input,
  accountIndex: number
): TxInput {
  const paymentKeyPath =
    input.address.paymentCredential.type === TyphonTypes.HashType.ADDRESS
      ? input.address.paymentCredential.bipPath
      : undefined;
  return {
    txHashHex: input.txId,
    outputIndex: input.index,
    path: paymentKeyPath
      ? str_to_path(
          getBipPathString({
            account: accountIndex,
            chain: paymentKeyPath.chain,
            index: paymentKeyPath.index,
          })
        )
      : null,
  };
}

export function getAccountStakeCredential(
  xpub: string,
  index: number
): StakeCredential {
  const accountXPubKey = getExtendedPublicKeyFromHex(xpub);
  const keyPath = getCredentialKey(
    accountXPubKey,
    getBipPath({
      account: index,
      chain: StakeChain.stake,
      index: STAKING_ADDRESS_INDEX,
    })
  );
  return {
    key: keyPath.key,
    path: keyPath.path,
  };
}

export function getOperationType({
  valueChange,
  fees,
}: {
  valueChange: BigNumber;
  fees: BigNumber;
}): OperationType {
  return valueChange.isNegative()
    ? valueChange.absoluteValue().eq(fees)
      ? "FEES"
      : "OUT"
    : valueChange.isPositive()
    ? "IN"
    : "NONE";
}

export function isTestnet(currency: CryptoCurrency): boolean {
  return getCryptoCurrencyById(currency.id).isTestnetFor ? true : false;
}

export function getAccountChange(
  t: APITransaction,
  accountCredentialsMap: Record<string, PaymentCredential>
): { ada: BigNumber; tokens: Array<Token> } {
  let accountInputAda = new BigNumber(0);
  const accountInputTokens: Array<Token> = [];
  t.inputs.forEach((i) => {
    if (accountCredentialsMap[i.paymentKey]) {
      accountInputAda = accountInputAda.plus(i.value);
      accountInputTokens.push(
        ...i.tokens.map((t) => ({
          assetName: t.assetName,
          policyId: t.policyId,
          amount: new BigNumber(t.value),
        }))
      );
    }
  });

  let accountOutputAda = new BigNumber(0);
  const accountOutputTokens: Array<Token> = [];
  t.outputs.forEach((o) => {
    if (accountCredentialsMap[o.paymentKey]) {
      accountOutputAda = accountOutputAda.plus(o.value);
      accountOutputTokens.push(
        ...o.tokens.map((t) => ({
          assetName: t.assetName,
          policyId: t.policyId,
          amount: new BigNumber(t.value),
        }))
      );
    }
  });

  return {
    ada: accountOutputAda.minus(accountInputAda),
    tokens: getTokenDiff(accountOutputTokens, accountInputTokens),
  };
}

export function getMemoFromTx(tx: APITransaction): string | undefined {
  let memo;
  const metadataValue = tx.metadata?.data.find(
    (m) => m.label === MEMO_LABEL.toString()
  );
  if (metadataValue) {
    try {
      const parsedValue = JSON.parse(metadataValue.value);
      if (
        parsedValue.msg &&
        Array.isArray(parsedValue.msg) &&
        parsedValue.msg.length
      ) {
        memo = parsedValue.msg.join(", ");
      }
      // eslint-disable-next-line no-empty
    } catch (e) {}
  }
  return memo;
}

export function isHexString(value: string): boolean {
  const regExp = /^[0-9a-fA-F]+$/;
  return regExp.test(value);
}
