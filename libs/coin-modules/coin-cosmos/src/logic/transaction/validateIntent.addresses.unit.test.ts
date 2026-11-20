import {
  Balance,
  FeeEstimation,
  StakingTransactionIntent,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";
import * as bech32 from "bech32";
import { validateIntent } from "./validateIntent";

const ADDRESSES: Record<string, string> = {
  cosmos: "cosmos1g84934jpu3v5de5yqukkkhxmcvsw3u2ajxvpdl",
  osmo: "osmo17gmcxyc5ccd5kwqqatpgfdgh380w2hc77zm0zw",
  coreum: "core10l6h3qw05u7qduqgafj8wlrx3fjhr852z7r5l2",
  injective: "inj1hn46zvx43mxq47vsecvw84k5chjhuhwp6d62dt",
  babylon: "bbn1uwpws077a0a9pclapv3f2fyj5u0mlh6ewmds8n",
  mantra: "mantra1gyauvl44q2apn3u3aujm36q8zrj74vry7n5nvn",
  xion: "xion1gyauvl44q2apn3u3aujm36q8zrj74vryh3y4ez",
  persistence: "persistence1gyauvl44q2apn3u3aujm36q8zrj74vrym5cypd",
  crypto_org: "cro1jr0kggxjd3k67eu7xr7lz4s30tynsmrz44fr39",
};

const SENDER = "sender-account";

const balances: Balance[] = [{ value: 10_000_000n, asset: { type: "native" } }];
const fees: FeeEstimation = { value: 5000n };

const sendTo = (recipient: string): TransactionIntent => ({
  intentType: "transaction",
  type: "send",
  sender: SENDER,
  recipient,
  amount: 1_000_000n,
  asset: { type: "native" },
});

const FOREIGN_ADDRESS_CASES = [
  ["osmo", "cosmos"],
  ["coreum", "cosmos"],
  ["injective", "cosmos"],
  ["babylon", "cosmos"],
  ["mantra", "cosmos"],
  ["xion", "cosmos"],
  ["persistence", "cosmos"],
  ["crypto_org", "cosmos"],
  ["cosmos", "osmo"],
  ["cosmos", "persistence"],
];

const withBrokenChecksum = (address: string) => `${address.slice(0, -1)}q`;

const recipientError = async (currencyId: string, recipient: string) => {
  const result = await validateIntent(currencyId, sendTo(recipient), balances, fees);
  return result.errors.recipient?.name;
};

describe("validateIntent recipient address of each chain", () => {
  it.each(Object.entries(ADDRESSES))(
    "accepts a %s address on its own chain",
    async (currencyId, address) => {
      await expect(recipientError(currencyId, address)).resolves.toBeUndefined();
    },
  );

  it.each(FOREIGN_ADDRESS_CASES)(
    "rejects on %s an address that belongs to %s",
    async (currencyId, otherCurrencyId) => {
      await expect(recipientError(currencyId, ADDRESSES[otherCurrencyId])).resolves.toBe(
        "InvalidAddress",
      );
    },
  );

  it.each(Object.entries(ADDRESSES))(
    "rejects a %s address with a broken checksum",
    async (currencyId, address) => {
      await expect(recipientError(currencyId, withBrokenChecksum(address))).resolves.toBe(
        "InvalidAddress",
      );
    },
  );

  it("rejects text that is not an address", async () => {
    await expect(recipientError("cosmos", "not an address")).resolves.toBe("InvalidAddress");
  });
});

const VALIDATOR_PREFIXES = [
  ["cosmos", "cosmosvaloper"],
  ["osmo", "osmovaloper"],
  ["coreum", "corevaloper"],
  ["injective", "injvaloper"],
  ["babylon", "bbnvaloper"],
  ["mantra", "mantravaloper"],
  ["xion", "xionvaloper"],
  ["persistence", "persistencevaloper"],
  ["crypto_org", "crocncl"],
];

const delegateTo = (valAddress: string): StakingTransactionIntent => ({
  intentType: "staking",
  type: "delegate",
  mode: "delegate",
  sender: SENDER,
  recipient: "",
  amount: 1_000_000n,
  valAddress,
  asset: { type: "native" },
});

const validatorError = async (currencyId: string, valAddress: string) => {
  const result = await validateIntent(currencyId, delegateTo(valAddress), balances, fees);
  return result.errors.valAddress?.name;
};

const VALIDATOR_PAYLOAD = Buffer.from("28ff5c6d57d8cfd492b6fb42614536ed648e01fd", "hex");

const validatorAddressOf = (prefix: string) =>
  bech32.encode(prefix, bech32.toWords(VALIDATOR_PAYLOAD));

describe("validateIntent validator address of each chain", () => {
  it.each(VALIDATOR_PREFIXES)("accepts a %s validator address", async (currencyId, prefix) => {
    await expect(validatorError(currencyId, validatorAddressOf(prefix))).resolves.toBeUndefined();
  });

  it.each(VALIDATOR_PREFIXES.filter(([currencyId]) => currencyId !== "cosmos"))(
    "rejects on %s a cosmos validator address",
    async currencyId => {
      await expect(validatorError(currencyId, validatorAddressOf("cosmosvaloper"))).resolves.toBe(
        "InvalidAddress",
      );
    },
  );

  it("rejects on cosmos an osmosis validator address", async () => {
    await expect(validatorError("cosmos", validatorAddressOf("osmovaloper"))).resolves.toBe(
      "InvalidAddress",
    );
  });

  it.each(VALIDATOR_PREFIXES)(
    "builds a bech32 %s validator address that decodes back",
    (_currencyId, prefix) => {
      expect(bech32.decode(validatorAddressOf(prefix)).prefix).toBe(prefix);
    },
  );
});
