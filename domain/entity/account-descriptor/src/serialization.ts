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

/** `account:1:<type>:<name>:<env>:<xpub or address>:<path>` */
export function serializeAccountDescriptor(descriptor: AccountDescriptor): string {
  const { purpose, version, type, network, path } = descriptor;
  const subject = descriptor.type === "utxo" ? descriptor.xpub : descriptor.address;
  return [purpose, version, type, network.name, network.env, subject, path].join(SEP);
}

export function parseAccountDescriptor(input: string): AccountDescriptor {
  const parts = input.split(SEP);
  if (parts.length < 7) {
    throw new InvalidAccountDescriptorError(
      `Invalid AccountDescriptor: expected at least 7 colon-separated fields, got ${parts.length}`,
    );
  }

  const [purpose, version, type, name, env, ...rest] = parts;
  if (purpose !== "account") {
    throw new InvalidAccountDescriptorError(
      `Invalid AccountDescriptor: expected purpose "account"`,
    );
  }
  if (version !== "1") {
    throw new InvalidAccountDescriptorError(`Invalid AccountDescriptor: expected version "1"`);
  }

  const path = rest.at(-1);
  const subject = rest.slice(0, -1).join(SEP);
  const network = { name, env };

  if (type === "utxo") {
    return validate(UtxoAccountDescriptorSchema, {
      purpose,
      version,
      type,
      network,
      xpub: subject,
      path,
    });
  }
  if (type === "address") {
    return validate(AddressAccountDescriptorSchema, {
      purpose,
      version,
      type,
      network,
      address: subject,
      path,
    });
  }
  throw new InvalidAccountDescriptorError(
    `Invalid AccountDescriptor type (expected "utxo" or "address")`,
  );
}
