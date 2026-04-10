import { decorateExtrinsics, Metadata, TypeRegistry } from "@polkadot/types";
import { Extrinsics } from "@polkadot/types/metadata/decorate/types";
import { getSpecTypes } from "@polkadot/types-known";
import { SidecarRuntimeSpec, SidecarTransactionMaterial } from "./types";

const USED_PALLETS = new Set(["Balances", "Staking"]);

export const createRegistryAndExtrinsics = (
  material: SidecarTransactionMaterial,
  spec: SidecarRuntimeSpec,
): {
  registry: TypeRegistry;
  extrinsics: Extrinsics;
} => {
  const registry: any = new TypeRegistry();
  const metadata = new Metadata(registry, material.metadata);
  // Register types specific to chain/runtimeVersion
  registry.register(
    getSpecTypes(
      registry,
      material.chainName,
      material.specName,
      Number(material.specVersion),
    ) as any,
  );
  // Register the chain properties for this registry
  registry.setChainProperties(
    registry.createType("ChainProperties", {
      ss58Format: Number(spec.properties.ss58Format),
      tokenDecimals: Number(spec.properties.tokenDecimals),
      tokenSymbol: spec.properties.tokenSymbol,
    }),
  );
  registry.setMetadata(metadata);
  const latest = metadata.asLatest;
  const extrinsics = decorateExtrinsics(
    registry,
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    {
      lookup: latest.lookup,
      pallets: latest.pallets.filter(p => p.calls.isSome && USED_PALLETS.has(p.name.toString())),
    } as typeof latest,
    metadata.version,
  );
  return {
    registry,
    extrinsics,
  };
};
