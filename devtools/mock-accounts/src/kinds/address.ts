import { AccountAddressSchema } from "@domain/entity-account-address";
import type { MockReader } from "../families/types";

/** An address descriptor's own address; a utxo account's a seeded one of its family, the same on every read. */
export const address: MockReader<"address"> = ({
  target: { descriptor },
  currency,
  family,
  random,
}) =>
  AccountAddressSchema.parse({
    freshAddress:
      descriptor.type === "address" ? descriptor.address : family.address(currency, random),
  });
