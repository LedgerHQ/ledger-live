import type Transport from "@ledgerhq/hw-transport";
import type { Transaction } from "./types";
import { createVarint } from "./varint";
import { MAX_SCRIPT_BLOCK } from "./constants";
export function startUntrustedHashTransactionInputRaw(
  transport: Transport,
  newTransaction: boolean,
  firstRound: boolean,
  transactionData: Buffer,
  bip143 = false,
  overwinter = false,
  additionals: Array<string> = []
): Promise<Buffer> {
  const p2 = additionals.includes("cashaddr")
    ? 0x03
    : bip143
    ? additionals.includes("sapling")
      ? 0x05
      : overwinter
      ? 0x04
      : 0x02
    : 0x00;
  return transport.send(
    0xe0,
    0x44,
    firstRound ? 0x00 : 0x80,
    newTransaction ? p2 : 0x80,
    transactionData
  );
}
export async function startUntrustedHashTransactionInput(
  transport: Transport,
  newTransaction: boolean,
  transaction: Transaction,
  inputs: Array<{
    trustedInput: boolean;
    value: Buffer;
  }>,
  bip143 = false,
  overwinter = false,
  additionals: Array<string> = [],
  useTrustedInputForSegwit = false
): Promise<any> {
  let data = Buffer.concat([
    transaction.version,
    transaction.timestamp || Buffer.alloc(0),
    transaction.nVersionGroupId || Buffer.alloc(0),
    createVarint(transaction.inputs.length),
  ]);
  await startUntrustedHashTransactionInputRaw(
    transport,
    newTransaction,
    true,
    data,
    bip143,
    overwinter,
    additionals
  );
  let i = 0;
  const isDecred = additionals.includes("decred");

  for (const input of transaction.inputs) {
    let prefix;
    const inputValue = inputs[i].value;

    if (bip143) {
      if (useTrustedInputForSegwit && inputs[i].trustedInput) {
        prefix = Buffer.from([0x01, inputValue.length]);
      } else {
        prefix = Buffer.from([0x02]);
      }
    } else {
      if (inputs[i].trustedInput) {
        prefix = Buffer.from([0x01, inputs[i].value.length]);
      } else {
        prefix = Buffer.from([0x00]);
      }
    }

    data = Buffer.concat([
      prefix,
      inputValue,
      isDecred ? Buffer.from([0x00]) : Buffer.alloc(0),
      createVarint(input.script.length),
    ]);
    await startUntrustedHashTransactionInputRaw(
      transport,
      newTransaction,
      false,
      data,
      bip143,
      overwinter,
      additionals
    );
    const scriptBlocks: Buffer[] = [];
    let offset = 0;

    if (input.script.length === 0) {
      scriptBlocks.push(input.sequence);
    } else {
      while (offset !== input.script.length) {
        const blockSize =
          input.script.length - offset > MAX_SCRIPT_BLOCK
            ? MAX_SCRIPT_BLOCK
            : input.script.length - offset;

        if (offset + blockSize !== input.script.length) {
          scriptBlocks.push(input.script.slice(offset, offset + blockSize));
        } else {
          scriptBlocks.push(
            Buffer.concat([
              input.script.slice(offset, offset + blockSize),
              input.sequence,
            ])
          );
        }

        offset += blockSize;
      }
    }

    for (const scriptBlock of scriptBlocks) {
      await startUntrustedHashTransactionInputRaw(
        transport,
        newTransaction,
        false,
        scriptBlock,
        bip143,
        overwinter,
        additionals
      );
    }

    i++;
  }
}
