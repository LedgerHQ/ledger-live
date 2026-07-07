jest.mock("../network/hubble", () => ({ getValidatorGroups: jest.fn() }));

import { BigNumber } from "bignumber.js";
import { getValidatorGroups } from "../network/hubble";
import { getValidators } from "./getValidators";

const GROUP = "0x4444444444444444444444444444444444444444";

describe("getValidators", () => {
  beforeEach(() => (getValidatorGroups as jest.Mock).mockReset());

  it("maps validator groups to framework Validators (votes → balance)", async () => {
    (getValidatorGroups as jest.Mock).mockResolvedValue([
      { address: GROUP, name: "Group A", votes: new BigNumber("1500000000000000000000") },
    ]);

    const page = await getValidators();

    expect(page.items).toHaveLength(1);
    expect(page.items[0].address).toBe(GROUP);
    expect(page.items[0].name).toBe("Group A");
    expect(page.items[0].balance).toBe(1_500_000_000_000_000_000_000n);
    expect(page.next).toBeUndefined();
  });

  it("returns an empty page when there are no eligible groups", async () => {
    (getValidatorGroups as jest.Mock).mockResolvedValue([]);

    const page = await getValidators();

    expect(page.items).toEqual([]);
    expect(page.next).toBeUndefined();
  });
});
