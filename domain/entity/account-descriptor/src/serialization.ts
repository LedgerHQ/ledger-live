import type { ZodType } from "zod";
import { InvalidAccountDescriptorError } from "./errors";
import {
  AddressAccountDescriptorSchema,
  UtxoAccountDescriptorSchema,
  type AccountDescriptor,
} from "./schema";

const SEP = ":";

function validate<T>(schema: ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new InvalidAccountDescriptorError(
      `Invalid AccountDescriptor: ${result.error.issues.map(i => i.message).join("; ")}`,
    );
  }
  return result.data;
}

/** `account:2:<type>:<network_id>:<xpub or address>:<path>` */
export function serializeAccountDescriptor(descriptor: AccountDescriptor): string {
  const { purpose, version, type, network, path } = descriptor;
  const subject = descriptor.type === "utxo" ? descriptor.xpub : descriptor.address;
  return [purpose, version, type, network, subject, path].join(SEP);
}

export function parseAccountDescriptor(input: string): AccountDescriptor {
  const [purpose, version, type, network, ...rest] = input.split(SEP);
  if (purpose !== "account") {
    throw new InvalidAccountDescriptorError(
      `Invalid AccountDescriptor: expected purpose "account"`,
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
  const subject = rest.slice(0, -1).join(SEP);
  const common = { purpose, version, type, network, path };

  if (type === "utxo") {
    return validate(UtxoAccountDescriptorSchema, { ...common, xpub: subject });
  }
  if (type === "address") {
    return validate(AddressAccountDescriptorSchema, { ...common, address: subject });
  }
  throw new InvalidAccountDescriptorError(
    `Invalid AccountDescriptor type (expected "utxo" or "address")`,
  );
}
