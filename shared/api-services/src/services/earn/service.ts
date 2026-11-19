import type { ApiServiceDescriptor } from "../../compose";
import { earnApi, earnApiExtra, type EarnApi } from "./api";
import type { EarnApiExtra } from "./types";

export function earnService(own: () => EarnApiExtra): ApiServiceDescriptor<EarnApi> {
  return { api: earnApi, buildExtra: () => earnApiExtra(own()) };
}
