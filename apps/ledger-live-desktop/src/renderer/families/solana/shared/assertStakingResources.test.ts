import type { SolanaAccount } from "@ledgerhq/live-common/families/solana/types";
import { assertStakingResources } from "./assertStakingResources";

const synced = {
  stakingResources: { delegations: [] },
} as unknown as SolanaAccount;

describe("assertStakingResources", () => {
  it("accepts an account that has already been synced", () => {
    expect(() => assertStakingResources(synced)).not.toThrow();
  });

  it.each([null, undefined, {}])("rejects %p", account => {
    expect(() => assertStakingResources(account as SolanaAccount | null | undefined)).toThrow(
      "solana: account and staking resources required",
    );
  });
});
