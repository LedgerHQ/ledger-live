import { IDL } from "@dfinity/candid";
import invariant from "invariant";

export { idlFactory as ledgerIdlFactory } from "./idl/ledger.idl";
export { idlFactory as indexIdlFactory } from "./idl/index.idl";

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

export const decodeCanisterIdlFunc = <T>(func: IDL.FuncClass, args: ArrayBuffer): T =>
  IDL.decode(func.retTypes, args) as T;
