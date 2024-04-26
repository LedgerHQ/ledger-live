import { expandMetadata, Metadata, TypeRegistry } from "@polkadot/types";
import { getSpecTypes } from "@polkadot/types-known";
import { Extrinsics } from "@polkadot/types/metadata/decorate/types";
import { log } from "@ledgerhq/logs";
import type { OperationType } from "@ledgerhq/types-live";
import { SidecarRuntimeSpec, SidecarTransactionMaterial } from "./sidecar.types";

/**
 * Returns the operation type by using his palletMethod
 * the method case depends from which indexer you are using
 *
 * @param {*} pallet
 * @param {*} palletMethod
 *
 * @returns {string} - OperationType
 */
export const getOperationType = (pallet: string, palletMethod: string): OperationType => {
  switch (palletMethod) {
    case "transfer":
    case "transferAllowDeath":
    case "transferKeepAlive":
      return "OUT";

    case "bond":
    case "bondExtra":
    case "rebond":
      return "BOND";

    case "unbond":
      return "UNBOND";

    case "nominate":
      return "NOMINATE";

    case "chill":
      return "CHILL";

    case "withdrawUnbonded":
      return "WITHDRAW_UNBONDED";

    case "setController":
      return "SET_CONTROLLER";

    case "payoutStakers":
      return "FEES";

    default:
      log("polkadot/api", `Unknown operation type ${pallet}.${palletMethod} - fallback to FEES`);
      return "FEES";
  }
};

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
  const extrinsics = expandMetadata(registry, metadata).tx;
  return {
    registry,
    extrinsics,
  };
};
