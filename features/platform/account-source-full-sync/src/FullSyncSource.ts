import type { AccountDataSource } from "@domain/api-account-data-source";

/** Empty until a datum is added: it serves nothing, so the router falls through to the next source. */
export class FullSyncSource implements AccountDataSource {
  readonly id = "full-sync";

  supports(): boolean {
    return false;
  }
}
