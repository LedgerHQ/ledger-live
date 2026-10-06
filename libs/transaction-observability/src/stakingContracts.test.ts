import {
  STAKING_CONTRACTS,
  inputCurrencyOf,
  outputCurrencyOf,
  stakingMethodOfContract,
  tokenBackedContracts,
} from "./stakingContracts";

const STETH = "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84";
const STADER_POOL = "0xcf5ea1b38380f6af39068375516daf40ed70d299";
const KELP_POOL = "0x036676389e48133b63a802f8635ad39e752d375d";
const STAKEKIT_USDE = "0x2d152fb171353e70e45322d32bc748f8a61d9971";
const POL_VALIDATOR_SHARE = "0x2ea3c215daeacc1c90b51443ab5d08a9ad816138";

const entries = Object.entries(STAKING_CONTRACTS);

describe("the contract map's entries", () => {
  // Lookups lower-case their input, so a checksum-cased key would never match.
  it.each(entries.map(([address]) => address))("%s is a lower-case EVM address", address => {
    expect(address).toMatch(/^0x[0-9a-f]{40}$/);
  });

  // A receipt token without a ticker would drop out of the CAL guard.
  it.each(entries.filter(([, c]) => c.isReceiptToken))(
    "%s, a receipt token, names its ticker",
    (_, contract) => {
      expect(contract.outputCurrency).toBeTruthy();
    },
  );

  it.each(entries)("%s says something", (_, contract) => {
    expect(contract.method ?? contract.outputCurrency ?? contract.inputCurrency).toBeDefined();
  });
});

describe("looking a contract up", () => {
  it.each([STETH, STETH.toLowerCase(), STETH.toUpperCase().replace("0X", "0x")])(
    "ignores the casing of %s",
    address => {
      expect(outputCurrencyOf(address)).toBe("stETH");
      expect(stakingMethodOfContract(address)).toBe("liquid");
    },
  );

  it.each([undefined, "0x00000000000000000000000000000000deadbeef"])(
    "names nothing for %s",
    address => {
      expect(outputCurrencyOf(address)).toBeUndefined();
      expect(inputCurrencyOf(address)).toBeUndefined();
      expect(stakingMethodOfContract(address)).toBeUndefined();
    },
  );

  it("names the staked token only where the call sends a token", () => {
    expect(inputCurrencyOf(STAKEKIT_USDE)).toBe("USDe");
    expect(inputCurrencyOf(POL_VALIDATOR_SHARE)).toBe("POL");
    expect(inputCurrencyOf(STETH)).toBeUndefined();
  });
});

describe("the contracts CAL can check", () => {
  const checked = new Map(tokenBackedContracts());

  it("keeps the receipt tokens, with their tickers", () => {
    expect(checked.get(STETH.toLowerCase())).toBe("stETH");
    expect(checked.get("0x2b2c81e08f1af8835a78bb2a90ae924ace0ea4be")).toBe("sAVAX");
  });

  it.each([
    ["the Stader pool", STADER_POOL],
    ["the Kelp pool", KELP_POOL],
    ["the StakeKit USDe contract", STAKEKIT_USDE],
    ["the POL ValidatorShare", POL_VALIDATOR_SHARE],
  ])("leaves out %s, which is not a token", (_, address) => {
    expect(checked.has(address)).toBe(false);
  });
});
