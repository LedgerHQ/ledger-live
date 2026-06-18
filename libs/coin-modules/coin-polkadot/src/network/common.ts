import { expandMetadata, Metadata, TypeRegistry } from "@polkadot/types";
import { Extrinsics } from "@polkadot/types/metadata/decorate/types";
import { getSpecTypes } from "@polkadot/types-known";
import { SidecarRuntimeSpec, SidecarTransactionMaterial } from "./types";

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
      // ss58Format may be absent (e.g. Westend Asset Hub): leave it unset (None) instead of NaN.
      ss58Format:
        spec.properties.ss58Format !== undefined ? Number(spec.properties.ss58Format) : undefined,
      tokenDecimals: Number(spec.properties.tokenDecimals),
      tokenSymbol: spec.properties.tokenSymbol,
    }),
  );
  registry.setMetadata(metadata);
  const extrinsics = expandMetadata(registry, metadata).tx;
  return {
    registry,
    extrinsics,
  };
};
