import { Account } from "..";
import { TypedEvmMessage } from "./evm";

export type DefaultMessage = {
  message: string;
  standard?: never;
  path?: string;
};

export type AnyMessage = DefaultMessage | TypedEvmMessage;

export type MessageProperties = {
  label: string;
  value: string | string[];
  _account?: Account;
}[];

export * from "./evm";
