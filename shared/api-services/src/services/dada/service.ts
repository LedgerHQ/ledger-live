import type { ApiServiceDescriptor } from "../../compose";
import { dadaApi, type DadaApi } from "./api";

// DADA has no `extraArgument` contract yet: its endpoints resolve their own URLs.
export function dadaService(): ApiServiceDescriptor<DadaApi> {
  return { api: dadaApi, buildExtra: () => ({}) };
}
