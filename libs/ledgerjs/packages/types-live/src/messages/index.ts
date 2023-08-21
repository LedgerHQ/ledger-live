import { TypedEvmMessage } from "./evm";

export type DefaultMessage = {
  message: string;
  standard?: never;
};

export type AnyMessage = DefaultMessage | TypedEvmMessage;

export * from "./evm";
