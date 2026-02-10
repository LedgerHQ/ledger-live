import type { IcpIndexDid } from "@icp-sdk/canisters/ledger/icp";
import { IDL } from "@icp-sdk/core/candid";
import invariant from "invariant";
import { idlFactory as indexIdlFactory } from "./idl/index.idl";
import { idlFactory as ledgerIdlFactory } from "./idl/ledger.idl";

/** Extract the value from a Candid optional ([] = None, [v] = Some(v)). */
export const fromNullable = <T>(value: [] | [T]): T | undefined => value?.[0];

type IDLField = [string, IDL.FuncClass];

/**
 * Retrieves the IDL function definition for a specific method from an IDL factory.
 */
export const getCanisterIdlFunc = (
  idlFactory: IDL.InterfaceFactory,
  methodName: string,
): IDL.FuncClass => {
  const fields = idlFactory({ IDL })._fields as IDLField[];
  const func = fields.find(f => f[0] === methodName);
  invariant(func, `[ICP](getCanisterIdlFunc) Method ${methodName} not found`);
  return func[1];
};

/**
 * Encodes arguments using the specified IDL function's argument types.
 */
export const encodeCanisterIdlFunc = (func: IDL.FuncClass, args: unknown[]): Uint8Array => {
  const encoded = IDL.encode(func.argTypes, args);
  return new Uint8Array(
    encoded.buffer.slice(encoded.byteOffset, encoded.byteOffset + encoded.byteLength),
  );
};

/**
 * Decodes a response buffer using the specified IDL function's return types.
 */
export const decodeCanisterIdlFunc = <T>(func: IDL.FuncClass, buffer: Uint8Array): T => {
  return IDL.decode(func.retTypes, buffer) as T;
};

export { ledgerIdlFactory, indexIdlFactory };
export { Principal } from "@icp-sdk/core/principal";
export type GetAccountIdentifierTransactionsResponse =
  IcpIndexDid.GetAccountIdentifierTransactionsResponse;
export type TransactionWithId = IcpIndexDid.TransactionWithId;
