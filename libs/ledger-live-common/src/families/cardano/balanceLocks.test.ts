import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { genAccount } from "../../mock/account";
import type { CardanoAccount, CardanoDelegation } from "./types";
import cardanoBalanceLocks from "./balanceLocks";

const delegation = (rewards: number): CardanoDelegation => ({
  status: true,
  deposit: "2000000",
  poolId: undefined,
  ticker: undefined,
  name: undefined,
  dRepHex: undefined,
  rewards: new BigNumber(rewards),
});

const base = genAccount("ada", { currency: getCryptoCurrencyById("cardano") });

const cardano = (
  balance: number,
  spendable: number,
  delegationInfo: CardanoDelegation | undefined,
): CardanoAccount => ({
  ...base,
  balance: new BigNumber(balance),
  spendableBalance: new BigNumber(spendable),
  cardanoResources: {
    externalCredentials: [],
    internalCredentials: [],
    delegation: delegationInfo,
    utxos: [],
    protocolParams: {
      minFeeA: "0",
      minFeeB: "0",
      stakeKeyDeposit: "2000000",
      lovelacePerUtxoWord: "0",
      collateralPercent: "0",
      priceSteps: "0",
      priceMem: "0",
      maxTxSize: "0",
      maxValueSize: "0",
      utxoCostPerByte: "0",
      minFeeRefScriptCostPerByte: "0",
      languageView: { PlutusScriptV1: [], PlutusScriptV2: [], PlutusScriptV3: [] },
    },
  },
});

describe("cardanoBalanceLocks", () => {
  it("answers the ADA held with tokens as a reserve, rewards and deposit left out", () => {
    expect(cardanoBalanceLocks(cardano(10_000, 8_000, delegation(500)))).toEqual([
      { reason: "reserve", amount: "1500" },
    ]);
  });

  it("answers no lock when the balance without rewards is spendable", () => {
    expect(cardanoBalanceLocks(cardano(10_000, 9_500, delegation(500)))).toEqual([]);
    expect(cardanoBalanceLocks(cardano(10_000, 10_000, undefined))).toEqual([]);
  });

  it("answers no lock for an account without Cardano resources", () => {
    expect(cardanoBalanceLocks(base)).toEqual([]);
  });
});
