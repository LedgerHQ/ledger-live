import { AccountReceiveSchema } from "@domain/entity-account-receive";
import type { MockReader } from "../families/types";

/** The address descriptor's own address, or a seeded one of the family for a utxo account, the device showing it. */
export const receive: MockReader<"receive"> = ({
  target: { descriptor },
  currency,
  family,
  random,
}) => {
  const [address, path] =
    descriptor.type === "address"
      ? [descriptor.address, descriptor.path]
      : [family.address(currency, random), `${descriptor.path}/0/0`];
  return AccountReceiveSchema.parse({ address, verification: { type: "address", path, address } });
};
