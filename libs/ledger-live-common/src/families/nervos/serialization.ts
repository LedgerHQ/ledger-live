import type { NervosResourcesRaw, NervosResources } from "./types";
import Xpub from "./xpub";

export function toNervosResourcesRaw(r: NervosResources): NervosResourcesRaw {
  return {
    ...r,
    xpub: r.xpub.export(),
  };
}

export function fromNervosResourcesRaw(r: NervosResourcesRaw): NervosResources {
  return {
    ...r,
    xpub: new Xpub({ data: r.xpub }),
  };
}
