import type { IcpIndexDid } from "@icp-sdk/canisters/ledger/icp";
import { IDL } from "@icp-sdk/core/candid";
import invariant from "invariant";

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
  const service = idlFactory({ IDL });
  // _fields is not part of the public IDL.ServiceClass type but is present at runtime
  const fields: IDLField[] = Reflect.get(service, "_fields");
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
  // IDL.decode returns an opaque type; caller provides the expected shape via T
  return IDL.decode(func.retTypes, buffer) as T;
};

export { idlFactory as ledgerIdlFactory } from "./idl/ledger.idl";
export { idlFactory as indexIdlFactory } from "./idl/index.idl";
export { Principal } from "@icp-sdk/core/principal";
export type GetAccountIdentifierTransactionsResponse =
  IcpIndexDid.GetAccountIdentifierTransactionsResponse;
export type TransactionWithId = IcpIndexDid.TransactionWithId;
