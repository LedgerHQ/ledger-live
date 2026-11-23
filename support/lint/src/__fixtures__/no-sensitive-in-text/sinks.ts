import type { AccountDescriptor, AccountKey, NetworkId } from "./schema";

declare function log(type: string, message: string, data?: unknown): void;
declare function invariant(condition: unknown, message?: string): asserts condition;
declare class DescriptorError extends Error {}
declare const descriptor: AccountDescriptor;
declare const key: AccountKey;
declare const network: NetworkId;
// oxlint-disable-next-line typescript/no-explicit-any -- the rule must skip `any`
declare const loose: any;
declare const keys: AccountKey[];
declare function css(strings: TemplateStringsArray, ...values: unknown[]): string;

export const template = `sync ${key}`;
export const concat = "sync " + key;
export const asString = String(key);
export const json = JSON.stringify(descriptor);
log("sync", "start", descriptor);
console.error(descriptor.key);
invariant(key, `missing ${network}`);
export const error = new DescriptorError(key);
log("sync", "nested", { target: { descriptor } });
log("sync", "array", keys);

export const safeTemplate = `sync ${network} ${descriptor.network}`;
export const safeAny = `sync ${loose}` + loose;
log("sync", "ok", { network });
export const tagged = css`
  ${key}
`;
