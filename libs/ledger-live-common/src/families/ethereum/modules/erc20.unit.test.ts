import { fetchERC20Tokens } from "./erc20";

beforeEach(() => {
  jest.resetModules();
});

jest.mock("../../../network", () => {
  return jest.fn().mockImplementationOnce(() => ({
    data: [
      [
        "ethereum",
        "$aapl",
        "$AAPL",
        18,
        "$AAPL",
        "3045022100a1e0859e2ad886121b0c5bb374622dcee83b6b0b26a5552559b56a328e4d50ad02202efc09d46a0770a40c6a650a9eec00ba9d8a6727a369398a5f8e3f1d698ccc71",
        "0x41eFc0253ee7Ea44400abB5F907FDbfdEbc82bec",
        true,
        false,
      ],
      [
        "ethereum",
        "$based",
        "$BASED",
        18,
        "$BASED",
        "304402207e5be628591465b9ee45b62d5d067beb99ead27485874371b213037137b60a9702205339b3d713d990b5c614a98c20b113978ae36ff72324183d35673a40b71493fc",
        "0x68A118Ef45063051Eac49c7e647CE5Ace48a68a5",
        false,
        false,
      ],
    ],
  }));
});

describe("fetch ERC20 Tokens", () => {
  it("normal behaviour", async () => {
    expect((await fetchERC20Tokens()).length).toBe(2);
  });

  it("not able to fetch", async () => {
    expect((await fetchERC20Tokens()).length).toBe(0);
  });
});
