import { BinaryReader, BinaryWriter } from "cosmjs-types/binary";
import {
  MsgBeginRedelegate,
  MsgDelegate,
  MsgUndelegate,
} from "cosmjs-types/cosmos/staking/v1beta1/tx";

// Codec for babylon/epoching/v1/tx.proto MsgWrapped*: each wraps the cosmos-sdk staking msg as field 1.
export const protobufPackage = "babylon.epoching.v1";

type InnerCodec<T> = {
  encode(message: T, writer?: BinaryWriter): BinaryWriter;
  decode(input: BinaryReader | Uint8Array, length?: number): T;
};

const wrappedCodec = <T>(name: string, inner: InnerCodec<T>) => ({
  typeUrl: `/${protobufPackage}.${name}`,
  encode(message: { msg?: T }, writer: BinaryWriter = BinaryWriter.create()): BinaryWriter {
    if (message.msg !== undefined) {
      inner.encode(message.msg, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },
  decode(input: BinaryReader | Uint8Array, length?: number): { msg?: T } {
    const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
    const end = length === undefined ? reader.len : reader.pos + length;
    const message: { msg?: T } = {};
    while (reader.pos < end) {
      const tag = reader.uint32();
      if (tag >>> 3 === 1) {
        message.msg = inner.decode(reader, reader.uint32());
      } else {
        reader.skipType(tag & 7);
      }
    }
    return message;
  },
});

export const MsgWrappedDelegate = wrappedCodec("MsgWrappedDelegate", MsgDelegate);
export const MsgWrappedUndelegate = wrappedCodec("MsgWrappedUndelegate", MsgUndelegate);
export const MsgWrappedBeginRedelegate = wrappedCodec(
  "MsgWrappedBeginRedelegate",
  MsgBeginRedelegate,
);
