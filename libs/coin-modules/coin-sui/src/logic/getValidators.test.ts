import * as network from "../network";
import { getValidators } from "./getValidators";

type NetworkValidator = {
  suiAddress: string;
  name: string;
  description: string;
  projectUrl: string;
  imageUrl: string;
  stakingPoolSuiBalance: string;
  commissionRate: string;
  apy: number;
};

jest.mock("../network", () => ({
  getValidators: jest.fn(),
}));

const mockedGetValidators = jest.mocked(network.getValidators);

describe("logic/getValidators", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("maps network validators to generic Validator and returns single page", async () => {
    const networkValidators: NetworkValidator[] = [
      {
        suiAddress: "0xabc",
        name: "Validator A",
        description: "desc",
        projectUrl: "https://example.com",
        imageUrl: "https://example.com/logo.png",
        stakingPoolSuiBalance: "1234567890",
        commissionRate: "0.1",
        apy: 0.08,
      },
      {
        suiAddress: "0xdef",
        name: "Validator B",
        description: "",
        projectUrl: "",
        imageUrl: "",
        stakingPoolSuiBalance: "0",
        commissionRate: "0",
        apy: 0,
      },
    ];

    mockedGetValidators.mockResolvedValueOnce(
      networkValidators as unknown as ReturnType<typeof network.getValidators>,
    );

    const page = await getValidators();

    expect(page.next).toBeUndefined();
    expect(page.items).toHaveLength(2);

    const [a, b] = page.items;
    expect(a).toEqual({
      address: "0xabc",
      name: "Validator A",
      description: "desc",
      url: "https://example.com",
      logo: "https://example.com/logo.png",
      balance: BigInt("1234567890"),
      commissionRate: "0.1",
      apy: 0.08,
    });

    expect(b).toEqual({
      address: "0xdef",
      name: "Validator B",
      description: undefined,
      url: undefined,
      logo: undefined,
      balance: 0n,
      commissionRate: "0",
      apy: 0,
    });
  });

  it("preserves non-empty description, url, and logo values without modification", async () => {
    const networkValidators: NetworkValidator[] = [
      {
        suiAddress: "0xaaa",
        name: "Validator With Metadata",
        description: "A well-described validator",
        projectUrl: "https://validator.example.com",
        imageUrl: "https://validator.example.com/logo.svg",
        stakingPoolSuiBalance: "9999999",
        commissionRate: "5",
        apy: 0.12,
      },
    ];

    mockedGetValidators.mockResolvedValueOnce(
      networkValidators as unknown as ReturnType<typeof network.getValidators>,
    );

    const page = await getValidators();

    expect(page.items).toHaveLength(1);
    const [v] = page.items;

    expect(v.description).toBe("A well-described validator");
    expect(v.url).toBe("https://validator.example.com");
    expect(v.logo).toBe("https://validator.example.com/logo.svg");
  });

  it("handles empty network response", async () => {
    mockedGetValidators.mockResolvedValueOnce(
      [] as unknown as ReturnType<typeof network.getValidators>,
    );

    const page = await getValidators();
    expect(page.items).toEqual([]);
    expect(page.next).toBeUndefined();
  });
});
