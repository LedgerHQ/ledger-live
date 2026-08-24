import { getVotesCount } from "./getVotesCount";

it("returns votes length", () => {
  const account = { tronResources: { votes: [1, 2, 3] } } as any;
  expect(getVotesCount(account)).toBe(3);
});

it("returns 0 for empty votes", () => {
  const account = { tronResources: { votes: [] } } as any;
  expect(getVotesCount(account)).toBe(0);
});

it("returns 0 when tronResources is missing", () => {
  const account = {} as any;
  expect(getVotesCount(account)).toBe(0);
});

it("returns 0 when votes is missing", () => {
  const account = { tronResources: {} } as any;
  expect(getVotesCount(account)).toBe(0);
});
