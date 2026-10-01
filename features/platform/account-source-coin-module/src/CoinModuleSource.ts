import type { AccountDataSource } from "@domain/api-account-data-source";

/** Empty until a datum is added: it serves nothing, so the router falls through to the next source. */
export class CoinModuleSource implements AccountDataSource {
  readonly id = "coin-module";

  supports(): boolean {
    return false;
  }
}
