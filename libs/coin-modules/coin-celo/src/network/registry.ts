import { registryABI } from "@celo/abis";
import { makeLRUCache } from "@ledgerhq/live-network/cache";
import { getCeloClient } from "./client";

/** On-chain Registry contract address (constant on mainnet and all Celo testnets). */
const REGISTRY_ADDRESS = "0x000000000000000000000000000000000000ce10" as const;

export type RegistryContractName =
  | "LockedGold"
  | "Election"
  | "Accounts"
  | "GoldToken"
  | "StableToken"
  | "StableTokenEUR"
  | "StableTokenBRL";

/**
 * Resolve a Celo system contract address from the on-chain Registry.
 * Results are cached for 1 hour, matching ContractKit's own caching behaviour.
 */
export const getRegistryAddressFor = makeLRUCache(
  async (name: RegistryContractName): Promise<`0x${string}`> => {
    const client = getCeloClient();
    const address = await client.readContract({
      address: REGISTRY_ADDRESS,
      abi: registryABI,
      functionName: "getAddressForString",
      args: [name],
    });
    return address;
  },
  name => name,
  {
    ttl: 60 * 60 * 1000, // 1 hour
    max: 20,
  },
);
