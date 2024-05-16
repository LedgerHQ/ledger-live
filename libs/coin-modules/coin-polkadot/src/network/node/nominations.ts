import { Exposure } from "@polkadot/types/interfaces";
import { SidecarNominations } from "../sidecar.types";
import getApiPromise from "./apiPromise";

export const fetchNominations = async (address: string): Promise<SidecarNominations> => {
  const api = await getApiPromise();
  const hash = await api.rpc.chain.getFinalizedHead();

  const [activeEraOption, nominationsOpt] = await Promise.all([
    api.query.staking.activeEra.at(hash),
    api.query.staking.nominators.at(hash, address),
  ]);

  if (activeEraOption.isNone) {
    // TODO refactor to newer error type
    throw new Error("ActiveEra is None when Some was expected.");
  }

  const { index: activeEra } = activeEraOption.unwrap();

  if (nominationsOpt.isNone) {
    return {
      submittedIn: null,
      targets: [],
    };
  }

  const { targets, submittedIn } = nominationsOpt.unwrap();

  const [exposures, stashes] = await Promise.all([
    api.query.staking.erasStakers.multi<Exposure>(targets.map(target => [activeEra, target])),
    api.derive.staking.stashes(),
  ]);

  const allStashes = stashes.map(stash => stash.toString());

  return {
    submittedIn: submittedIn.toString(),
    targets: targets.map((target, index) => {
      const exposure = exposures[index];

      const individualExposure = exposure?.others.find(o => o.who.toString() === address);
      const value = individualExposure ? individualExposure.value : null;

      const status = exposure.others.length
        ? individualExposure
          ? "active"
          : "inactive"
        : allStashes.includes(target.toString())
        ? "waiting"
        : null;

      return {
        address: target.toString(),
        value: value?.toString() || "0",
        status,
      };
    }),
  };
};
