import type { ZodType } from "zod";
import { InvalidAccountDescriptorError } from "./errors";
import {
  AccountPurposeSchema,
  AddressAccountDescriptorSchema,
  UtxoAccountDescriptorSchema,
  type AccountDescriptor,
} from "./schema";
import { SEP, formatDescriptorFields } from "./serialization.internals";

function validate<T>(schema: ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new InvalidAccountDescriptorError(
      `Invalid AccountDescriptor: ${result.error.issues.map(i => i.message).join("; ")}`,
    );
  }
  return result.data;
}

/** `<purpose>:2:<type>:<network_id>:<key>:<path>`, the purpose being `account` or `mock` */
export function serializeAccountDescriptor(descriptor: AccountDescriptor): string {
  return formatDescriptorFields(descriptor);
}

export function parseAccountDescriptor(input: string): AccountDescriptor {
  const [rawPurpose, version, type, network, ...rest] = input.split(SEP);
  const purpose = AccountPurposeSchema.safeParse(rawPurpose);
  if (!purpose.success) {
    throw new InvalidAccountDescriptorError(
      `Invalid AccountDescriptor: expected purpose "account" or "mock"`,
    );
  }
  if (version !== "2") {
    throw new InvalidAccountDescriptorError(`Invalid AccountDescriptor: expected version "2"`);
  }
  if (rest.length < 2) {
    throw new InvalidAccountDescriptorError(
      `Invalid AccountDescriptor: expected at least 6 colon-separated fields`,
    );
  }

  const path = rest.at(-1);
  const key = rest.slice(0, -1).join(SEP);
  const fields = { purpose: purpose.data, version, type, network, key, path };

  if (type === "utxo") return validate(UtxoAccountDescriptorSchema, fields);
  if (type === "address") return validate(AddressAccountDescriptorSchema, fields);
  throw new InvalidAccountDescriptorError(
    `Invalid AccountDescriptor type (expected "utxo" or "address")`,
  );
}
