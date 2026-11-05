import { AccountAssetReceiveSchema } from "@domain/entity-account-receive";
import type { MockReader } from "../families/types";

/**
 * Ready on the address descriptor's own address, or on a seeded one of the family for a utxo account, the device showing it.
 * A token the balance does not hold must be activated first, whatever the network, to show that status.
 */
export const receive: MockReader<"receive"> = (
  { target: { descriptor }, currency, family, random, balances },
  query,
) => {
  const assetId = query?.assetId ?? currency.id;
  if (assetId !== currency.id && !balances().some(balance => balance.assetId === assetId)) {
    return AccountAssetReceiveSchema.parse({
      assetId,
      receive: { status: "assetActivationRequired" },
    });
  }
  const [address, path] =
    descriptor.type === "address"
      ? [descriptor.address, descriptor.path]
      : [family.address(currency, random), `${descriptor.path}/0/0`];
  return AccountAssetReceiveSchema.parse({
    assetId,
    receive: { status: "ready", address, verification: { type: "address", path, address } },
  });
};
