import { IDL } from "@icp-sdk/core/candid";
import invariant from "invariant";

export { idlFactory as ledgerIdlFactory } from "./idl/ledger.idl";
export { idlFactory as indexIdlFactory } from "./idl/index.idl";
export { idlFactory as governanceIdlFactory } from "./idl/governance.idl";

// A factory rebuilds its whole service definition on every call; memoize it per factory
// (the factories are stable module-level references).
const serviceCache = new WeakMap<IDL.InterfaceFactory, IDL.ServiceClass>();

const getService = (idlFactory: IDL.InterfaceFactory): IDL.ServiceClass => {
  let service = serviceCache.get(idlFactory);
  if (!service) {
    service = idlFactory({ IDL });
    serviceCache.set(idlFactory, service);
  }
  return service;
};

export const getCanisterIdlFunc = (
  idlFactory: IDL.InterfaceFactory,
  methodName: string,
): IDL.FuncClass => {
  const func = getService(idlFactory)._fields.find(f => f[0] === methodName);
  invariant(func, `[ICP](getCanisterIdlFunc) Method ${methodName} not found`);
  return func[1];
};

export const encodeCanisterIdlFunc = (func: IDL.FuncClass, args: unknown[]) =>
  IDL.encode(func.argTypes, args);

export const decodeCanisterIdlFunc = <T>(func: IDL.FuncClass, args: Uint8Array): T =>
  IDL.decode(func.retTypes, args) as T;

// An archive canister's get_encoded_blocks. The ledger hands it out as a callback for the blocks it
// no longer holds; the vendored ledger IDL declares it only inline, so it is restated here.
export const archiveEncodedBlocksFunc = IDL.Func(
  [IDL.Record({ start: IDL.Nat64, length: IDL.Nat64 })],
  [
    IDL.Variant({
      Ok: IDL.Vec(IDL.Vec(IDL.Nat8)),
      Err: IDL.Variant({
        BadFirstBlockIndex: IDL.Record({
          requested_index: IDL.Nat64,
          first_valid_index: IDL.Nat64,
        }),
        Other: IDL.Record({ error_message: IDL.Text, error_code: IDL.Nat64 }),
      }),
    }),
  ],
  ["query"],
);

/** The value of a decoded Candid `opt` (`[]` | `[value]`), or undefined when absent. */
export const fromOpt = <T>(opt: [] | [T]): T | undefined => (opt.length ? opt[0] : undefined);
