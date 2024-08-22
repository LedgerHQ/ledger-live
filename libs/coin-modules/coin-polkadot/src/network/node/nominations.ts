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

  const stashes = await api.derive.staking.stashes();

  const allStashes = stashes.map(stash => stash.toString());
  const returnTargets = [];
  const targetIds = targets.map(t => t.toString());

  const queries = targetIds.map(targetId => [activeEra, targetId]);
  const exposures = await api.query.staking.erasStakersOverview.multi(queries);
  let targetIndex = 0;
  for (const id of targetIds) {
    let status: "active" | "inactive" | "waiting" | null = null;
    let value = "0";
    const exposure = exposures[targetIndex];
    targetIndex++;
    if (exposure.isNone) {
      if (allStashes.includes(id)) {
        status = "waiting";
      }
    } else {
      const pageCount: number = (exposure.toJSON() as any).pageCount ?? 0;
      console.log("pageCount", pageCount);
      for (let i = 0; i < pageCount; i++) {
        const nominators = (await api.query.staking.erasStakersPaged(activeEra, id, i)).unwrap()
          .others;
        if (!status && nominators.length > 0) {
          status = "inactive";
        }
        const nominator = nominators.find(n => n.who.toString() === address);
        if (nominator) {
          status = "active";
          value = nominator.value.toString();
          break;
        }
      }
    }
    returnTargets.push({
      address: id,
      value,
      status,
    });
  }
  return {
    submittedIn: submittedIn.toString(),
    targets: returnTargets,
  };
};
