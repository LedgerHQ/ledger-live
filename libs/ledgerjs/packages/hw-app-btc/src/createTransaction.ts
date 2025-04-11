import { log } from "@ledgerhq/logs";
import type Transport from "@ledgerhq/hw-transport";
import { hashPublicKey } from "./hashPublicKey";
import { getWalletPublicKey } from "./getWalletPublicKey";
import type { AddressFormat } from "./getWalletPublicKey";
import { getTrustedInput } from "./getTrustedInput";
import { startUntrustedHashTransactionInput } from "./startUntrustedHashTransactionInput";
import { serializeTransaction } from "./serializeTransaction";
import { getTrustedInputBIP143 } from "./getTrustedInputBIP143";
import { compressPublicKey } from "./compressPublicKey";
import { signTransaction } from "./signTransaction";
import { hashOutputFull, provideOutputFullChangePath } from "./finalizeInput";
import { getAppAndVersion } from "./getAppAndVersion";
import type { TransactionOutput, Transaction } from "./types";
import {
  DEFAULT_LOCKTIME,
  DEFAULT_SEQUENCE,
  SIGHASH_ALL,
  OP_DUP,
  OP_HASH160,
  HASH_SIZE,
  OP_EQUALVERIFY,
  OP_CHECKSIG,
  ZCASH_ACTIVATION_HEIGHTS,
} from "./constants";
import { shouldUseTrustedInputForSegwit } from "./shouldUseTrustedInputForSegwit";
import { shouldUseOlderZcash } from "./utils";
export type { AddressFormat };

const defaultsSignTransaction = {
  lockTime: DEFAULT_LOCKTIME,
  sigHashType: SIGHASH_ALL,
  segwit: false,
  additionals: [],
  onDeviceStreaming: _e => {},
  onDeviceSignatureGranted: () => {},
  onDeviceSignatureRequested: () => {},
};

export const getZcashBranchId = (blockHeight: number | null | undefined): Buffer => {
  const branchId = Buffer.alloc(4);
  if (!blockHeight || blockHeight >= ZCASH_ACTIVATION_HEIGHTS.NU6) {
    // NOTE: null and undefined should default to latest version
    branchId.writeUInt32LE(0xc8e71055, 0);
  } else if (blockHeight >= ZCASH_ACTIVATION_HEIGHTS.NU5) {
    branchId.writeUInt32LE(0xc2d6d0b4, 0);
  } else if (blockHeight >= ZCASH_ACTIVATION_HEIGHTS.CANOPY) {
    branchId.writeUInt32LE(0xe9ff75a6, 0);
  } else if (blockHeight >= ZCASH_ACTIVATION_HEIGHTS.HEARTWOOD) {
    branchId.writeUInt32LE(0xf5b9230b, 0);
  } else if (blockHeight >= ZCASH_ACTIVATION_HEIGHTS.BLOSSOM) {
    branchId.writeUInt32LE(0x2bb40e60, 0);
  } else if (blockHeight >= ZCASH_ACTIVATION_HEIGHTS.SAPLING) {
    branchId.writeUInt32LE(0x76b809bb, 0);
  } else {
    branchId.writeUInt32LE(0x5ba81b19, 0);
  }
  return branchId;
};

const getZcashTransactionVersion = (blockHeight: number | null | undefined): Buffer => {
  const version = Buffer.alloc(4);
  if (blockHeight && blockHeight < ZCASH_ACTIVATION_HEIGHTS.NU6) {
    version.writeUInt32LE(0x80000005, 0);
  } else {
    version.writeUInt32LE(0x80000006, 0);
  }
  return version;
};

export const getDefaultVersions = ({
  isZcash,
  sapling,
  isDecred,
  expiryHeight,
}: {
  isZcash: boolean;
  sapling: boolean;
  isDecred: boolean;
  expiryHeight: Buffer | undefined;
}): { defaultVersion: Buffer } => {
  const defaultVersion = Buffer.alloc(4);

  if (!!expiryHeight && !isDecred) {
    if (isZcash) {
      defaultVersion.writeUInt32LE(0x80000005, 0);
    } else if (sapling) {
      defaultVersion.writeUInt32LE(0x80000004, 0);
    } else {
      defaultVersion.writeUInt32LE(0x80000003, 0);
    }
  } else {
    defaultVersion.writeUInt32LE(1, 0);
  }
  return { defaultVersion };
};

/**
 *
 */
export type CreateTransactionArg = {
  inputs: Array<
    [
      Transaction,
      number,
      string | null | undefined,
      number | null | undefined,
      (number | null | undefined)?,
    ]
  >;
  associatedKeysets: string[];
  changePath?: string;
  outputScriptHex: string;
  lockTime?: number;
  blockHeight?: number;
  sigHashType?: number;
  segwit?: boolean;
  additionals: Array<string>;
  expiryHeight?: Buffer;
  useTrustedInputForSegwit?: boolean;
  onDeviceStreaming?: (arg0: { progress: number; total: number; index: number }) => void;
  onDeviceSignatureRequested?: () => void;
  onDeviceSignatureGranted?: () => void;
};
export async function createTransaction(
  transport: Transport,
  arg: CreateTransactionArg,
): Promise<string> {
  const signTx = { ...defaultsSignTransaction, ...arg };
  const {
    inputs,
    associatedKeysets,
    blockHeight,
    changePath,
    outputScriptHex,
    lockTime,
    sigHashType,
    segwit,
    additionals,
    expiryHeight,
    onDeviceStreaming,
    onDeviceSignatureGranted,
    onDeviceSignatureRequested,
  } = signTx;
  let useTrustedInputForSegwit = signTx.useTrustedInputForSegwit;

  if (useTrustedInputForSegwit === undefined) {
    try {
      const a = await getAppAndVersion(transport);
      useTrustedInputForSegwit = shouldUseTrustedInputForSegwit(a);
    } catch (e: any) {
      if (e.statusCode === 0x6d00) {
        useTrustedInputForSegwit = false;
      } else {
        throw e;
      }
    }
  }

  // loop: 0 or 1 (before and after)
  // i: index of the input being streamed
  // i goes on 0...n, inluding n. in order for the progress value to go to 1
  // we normalize the 2 loops to make a global percentage
  const notify = (loop, i) => {
    const { length } = inputs;
    if (length < 3) return; // there is not enough significant event to worth notifying (aka just use a spinner)

    const index = length * loop + i;
    const total = 2 * length;
    const progress = index / total;
    onDeviceStreaming({
      progress,
      total,
      index,
    });
  };

  const isDecred = additionals.includes("decred");
  const isZcash = additionals.includes("zcash");
  let useOlderZcash = false;
  if (isZcash) {
    useOlderZcash = await shouldUseOlderZcash(transport);
  }

  const sapling = additionals.includes("sapling");
  const bech32 = segwit && additionals.includes("bech32");
  const useBip143 =
    segwit ||
    (!!additionals &&
      (additionals.includes("abc") ||
        additionals.includes("gold") ||
        additionals.includes("bip143"))) ||
    (!!expiryHeight && !isDecred);
  // Inputs are provided as arrays of [transaction, output_index, optional redeem script, optional sequence]
  // associatedKeysets are provided as arrays of [path]
  const lockTimeBuffer = Buffer.alloc(4);
  lockTimeBuffer.writeUInt32LE(lockTime, 0);
  const nullScript = Buffer.alloc(0);
  const nullPrevout = Buffer.alloc(0);

  const { defaultVersion } = getDefaultVersions({
    isZcash,
    sapling,
    isDecred,
    expiryHeight,
  });
  // Default version to 2 for XST not to have timestamp
  const trustedInputs: Array<any> = [];
  const regularOutputs: Array<TransactionOutput> = [];
  const signatures: Buffer[] = [];
  const publicKeys: Buffer[] = [];
  let firstRun = true;
  const resuming = false;
  const targetTransaction: Transaction = {
    inputs: [],
    version: useOlderZcash ? Buffer.from([0x06, 0x00, 0x00, 0x80]) : defaultVersion,
    timestamp: Buffer.alloc(0),
  };
  const getTrustedInputCall =
    useBip143 && !useTrustedInputForSegwit ? getTrustedInputBIP143 : getTrustedInput;
  const outputScript = Buffer.from(outputScriptHex, "hex");
  notify(0, 0);
  // first pass on inputs to get trusted inputs
  for (const input of inputs) {
    if (!resuming) {
      if (isZcash) {
        if (useOlderZcash) {
          input[0].version = getZcashTransactionVersion(input[4]);
        } else {
          input[0].consensusBranchId = getZcashBranchId(input[4]);
        }
      }
      const trustedInput = await getTrustedInputCall(transport, input[1], input[0], additionals);
      log("hw", "got trustedInput=" + trustedInput);
      const sequence = Buffer.alloc(4);
      sequence.writeUInt32LE(
        input.length >= 4 && typeof input[3] === "number" ? input[3] : DEFAULT_SEQUENCE,
        0,
      );
      trustedInputs.push({
        trustedInput: true,
        value: Buffer.from(trustedInput, "hex"),
        sequence,
      });
    }

    const { outputs } = input[0];
    const index = input[1];

    if (outputs && index <= outputs.length - 1) {
      regularOutputs.push(outputs[index]);
    }

    if (expiryHeight && !isDecred) {
      targetTransaction.nVersionGroupId = Buffer.from(
        // nVersionGroupId is 0x26A7270A for zcash NU5 upgrade
        // refer to https://github.com/zcash/zcash/blob/master/src/primitives/transaction.h
        isZcash
          ? [0x0a, 0x27, 0xa7, 0x26]
          : sapling
            ? [0x85, 0x20, 0x2f, 0x89]
            : [0x70, 0x82, 0xc4, 0x03],
      );
      targetTransaction.nExpiryHeight = expiryHeight;
      // For sapling : valueBalance (8), nShieldedSpend (1), nShieldedOutput (1), nJoinSplit (1)
      // Overwinter : use nJoinSplit (1)
      targetTransaction.extraData = Buffer.from(
        sapling ? [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00] : [0x00],
      );
    } else if (isDecred) {
      targetTransaction.nExpiryHeight = expiryHeight;
    }
  }

  targetTransaction.inputs = inputs.map((input, idx) => {
    const sequence = Buffer.alloc(4);
    sequence.writeUInt32LE(
      input.length >= 4 && typeof input[3] === "number" ? input[3] : DEFAULT_SEQUENCE,
      0,
    );
    return {
      script: isZcash ? regularOutputs[idx].script : nullScript,
      prevout: nullPrevout,
      sequence,
    };
  });

  if (!resuming) {
    // Collect public keys
    const result: {
      publicKey: string;
      bitcoinAddress: string;
      chainCode: string;
    }[] = [];

    for (let i = 0; i < inputs.length; i++) {
      const r = await getWalletPublicKey(transport, {
        path: associatedKeysets[i],
      });
      notify(0, i + 1);
      result.push(r);
    }

    for (let i = 0; i < result.length; i++) {
      publicKeys.push(compressPublicKey(Buffer.from(result[i].publicKey, "hex")));
    }
  }

  onDeviceSignatureRequested();

  targetTransaction.consensusBranchId = getZcashBranchId(blockHeight);
  if (useBip143) {
    // Do the first run with all inputs
    await startUntrustedHashTransactionInput(
      transport,
      true,
      targetTransaction,
      trustedInputs,
      true,
      !!expiryHeight,
      additionals,
      useTrustedInputForSegwit,
    );

    if (!resuming && changePath) {
      await provideOutputFullChangePath(transport, changePath);
    }

    await hashOutputFull(transport, outputScript);
  }

  if (!!expiryHeight && !isDecred) {
    await signTransaction(transport, "", lockTime, SIGHASH_ALL, expiryHeight);
  }

  // Do the second run with the individual transaction
  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];
    const script =
      inputs[i].length >= 3 && typeof input[2] === "string"
        ? Buffer.from(input[2], "hex")
        : !segwit
          ? regularOutputs[i].script
          : Buffer.concat([
              Buffer.from([OP_DUP, OP_HASH160, HASH_SIZE]),
              hashPublicKey(publicKeys[i]),
              Buffer.from([OP_EQUALVERIFY, OP_CHECKSIG]),
            ]);
    const pseudoTX = Object.assign({}, targetTransaction);
    const pseudoTrustedInputs = useBip143 ? [trustedInputs[i]] : trustedInputs;

    if (useBip143) {
      pseudoTX.inputs = [{ ...pseudoTX.inputs[i], script }];
    } else {
      pseudoTX.inputs[i].script = script;
    }

    await startUntrustedHashTransactionInput(
      transport,
      !useBip143 && firstRun,
      pseudoTX,
      pseudoTrustedInputs,
      useBip143,
      !!expiryHeight && !isDecred,
      additionals,
      useTrustedInputForSegwit,
    );

    if (!useBip143) {
      if (!resuming && changePath) {
        await provideOutputFullChangePath(transport, changePath);
      }

      await hashOutputFull(transport, outputScript, additionals);
    }

    if (firstRun) {
      onDeviceSignatureGranted();
      notify(1, 0);
    }

    const signature = await signTransaction(
      transport,
      associatedKeysets[i],
      lockTime,
      sigHashType,
      expiryHeight,
      additionals,
    );
    notify(1, i + 1);
    signatures.push(signature);
    targetTransaction.inputs[i].script = nullScript;

    if (firstRun) {
      firstRun = false;
    }
  }

  targetTransaction.version = defaultVersion;
  targetTransaction.consensusBranchId = getZcashBranchId(blockHeight);
  // Populate the final input scripts
  for (let i = 0; i < inputs.length; i++) {
    if (segwit) {
      targetTransaction.witness = Buffer.alloc(0);

      if (!bech32) {
        targetTransaction.inputs[i].script = Buffer.concat([
          Buffer.from("160014", "hex"),
          hashPublicKey(publicKeys[i]),
        ]);
      }
    } else {
      const signatureSize = Buffer.alloc(1);
      const keySize = Buffer.alloc(1);
      signatureSize[0] = signatures[i].length;
      keySize[0] = publicKeys[i].length;
      targetTransaction.inputs[i].script = Buffer.concat([
        signatureSize,
        signatures[i],
        keySize,
        publicKeys[i],
      ]);
    }

    const offset = useBip143 && !useTrustedInputForSegwit ? 0 : 4;
    targetTransaction.inputs[i].prevout = trustedInputs[i].value.slice(offset, offset + 0x24);
  }
  targetTransaction.locktime = lockTimeBuffer;
  let result = Buffer.concat([
    serializeTransaction(targetTransaction, false, targetTransaction.timestamp, additionals),
    outputScript,
  ]);
  if (segwit && !isDecred) {
    let witness = Buffer.alloc(0);

    for (let i = 0; i < inputs.length; i++) {
      const tmpScriptData = Buffer.concat([
        Buffer.from("02", "hex"),
        Buffer.from([signatures[i].length]),
        signatures[i],
        Buffer.from([publicKeys[i].length]),
        publicKeys[i],
      ]);
      witness = Buffer.concat([witness, tmpScriptData]);
    }

    result = Buffer.concat([result, witness]);
  }

  // from to https://zips.z.cash/zip-0225, zcash is different with other coins, the lock_time and nExpiryHeight fields are before the inputs and outputs
  if (!isZcash) {
    result = Buffer.concat([result, lockTimeBuffer]);
    if (expiryHeight) {
      result = Buffer.concat([
        result,
        targetTransaction.nExpiryHeight || Buffer.alloc(0),
        targetTransaction.extraData || Buffer.alloc(0),
      ]);
    }
  }
  if (isDecred) {
    let decredWitness = Buffer.from([targetTransaction.inputs.length]);
    inputs.forEach((input, inputIndex) => {
      decredWitness = Buffer.concat([
        decredWitness,
        Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
        Buffer.from([0x00, 0x00, 0x00, 0x00]), //Block height
        Buffer.from([0xff, 0xff, 0xff, 0xff]), //Block index
        Buffer.from([targetTransaction.inputs[inputIndex].script.length]),
        targetTransaction.inputs[inputIndex].script,
      ]);
    });
    result = Buffer.concat([result, decredWitness]);
  }
  if (isZcash) {
    result = Buffer.concat([result, Buffer.from([0x00, 0x00, 0x00])]);
  }
  return result.toString("hex");
}
