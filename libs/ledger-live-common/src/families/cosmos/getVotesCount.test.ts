import type { CosmosAccount } from "@ledgerhq/coin-cosmos/types/index";
import { getVotesCount } from "./getVotesCount";

it("returns delegations length", () => {
  const account = { stakingResources: { delegations: [{}, {}] } } as any;
  expect(getVotesCount(account)).toBe(2);
});

it("returns 0 for empty delegations", () => {
  const account = { stakingResources: { delegations: [] } } as any;
  expect(getVotesCount(account)).toBe(0);
});

it("returns 0 when stakingResources is undefined", () => {
  const account = {} as unknown as CosmosAccount;
  expect(getVotesCount(account)).toBe(0);
});
