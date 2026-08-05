import { getTronSuperRepresentatives } from "../network";
import type { SuperRepresentative } from "../types";
import { getValidators } from "./getValidators";

jest.mock("../network", () => ({ getTronSuperRepresentatives: jest.fn() }));

const mockGetSuperRepresentatives = jest.mocked(getTronSuperRepresentatives);

const superRepresentative = (
  overrides: Partial<SuperRepresentative> = {},
): SuperRepresentative => ({
  address: "TLyqzVGLV1srkB7dToTAEqgDSfPtXRJZYH",
  url: "https://www.example-sr.org/about",
  isJobs: false,
  voteCount: 1_500,
  totalProduced: 10,
  totalMissed: 0,
  latestBlockNum: 1,
  latestSlotNum: 1,
  ...overrides,
});

describe("getValidators", () => {
  beforeEach(() => jest.clearAllMocks());

  it("maps a super representative onto a framework Validator", async () => {
    mockGetSuperRepresentatives.mockResolvedValue([superRepresentative()]);

    const { items, next } = await getValidators();

    expect(items).toEqual([
      {
        address: "TLyqzVGLV1srkB7dToTAEqgDSfPtXRJZYH",
        name: "www.example-sr.org",
        url: "https://www.example-sr.org/about",
        balance: 1_500_000_000n,
      },
    ]);
    expect(next).toBeUndefined();
  });

  it("falls back to the address when the SR declares no url", async () => {
    mockGetSuperRepresentatives.mockResolvedValue([superRepresentative({ url: null })]);

    const [validator] = (await getValidators()).items;

    expect(validator.name).toBe("TLyqzVGLV1srkB7dToTAEqgDSfPtXRJZYH");
    expect(validator.url).toBeUndefined();
  });

  it("falls back to the raw url when it is not parseable", async () => {
    mockGetSuperRepresentatives.mockResolvedValue([superRepresentative({ url: "not a url" })]);

    const [validator] = (await getValidators()).items;

    expect(validator.name).toBe("not a url");
  });

  it("rejects a cursor rather than looping a paginating caller forever", async () => {
    await expect(getValidators("some-cursor")).rejects.toThrow(/does not paginate/);
    expect(mockGetSuperRepresentatives).not.toHaveBeenCalled();
  });
});
