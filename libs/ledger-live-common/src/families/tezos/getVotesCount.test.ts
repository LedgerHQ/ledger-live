jest.mock("./staking", () => ({ isAccountDelegating: (a: any) => !!a._delegating }));

import { getVotesCount } from "./getVotesCount";

it("returns 1 when delegating", () => {
  expect(getVotesCount({ _delegating: true } as any)).toBe(1);
});

it("returns 0 when not delegating", () => {
  expect(getVotesCount({ _delegating: false } as any)).toBe(0);
});
