import { getVotesCount } from "./getVotesCount";

it("returns delegations length", () => {
  const account = { cosmosResources: { delegations: [{}, {}] } } as any;
  expect(getVotesCount(account)).toBe(2);
});

it("returns 0 for empty delegations", () => {
  const account = { cosmosResources: { delegations: [] } } as any;
  expect(getVotesCount(account)).toBe(0);
});
