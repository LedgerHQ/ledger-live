import { ethers } from "ethers";
import { MemoNotSupported } from "@ledgerhq/coin-module-framework/api/index";
import { TransactionIntent, BufferTxData } from "@ledgerhq/coin-module-framework/api/types";
import { CryptoCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import { getStakingABI } from "./abis";
import { buildStakingTransactionParams } from "./transactionData";
import { STAKING_CONTRACTS } from "./contracts";

const asCurrency = (id: string): CryptoCurrency =>
  ({ id, family: "evm", ethereumLikeInfo: { chainId: 1 } }) as CryptoCurrency;

const delegateIntent = (
  fields: Partial<Record<string, unknown>>,
): TransactionIntent<MemoNotSupported, BufferTxData> =>
  ({
    intentType: "staking",
    type: "staking-legacy",
    mode: "delegate",
    amount: 1000000000000000000n,
    asset: { type: "native" },
    recipient: "0xRecipient",
    sender: "0xSender",
    data: { type: "buffer", value: Buffer.from([]) },
    ...fields,
  }) as unknown as TransactionIntent<MemoNotSupported, BufferTxData>;

describe("buildStakingTransactionParams", () => {
  it("encodes a Monad delegate by valId with the amount carried as msg.value", () => {
    const intent = delegateIntent({
      valId: "42",
      valAddress: "0xDisplayAddressIgnoredByEncoder",
    });

    const { to, data, value } = buildStakingTransactionParams(asCurrency("monad"), intent);

    const iface = new ethers.Interface(getStakingABI("monad") as ethers.InterfaceAbi);
    expect("0x" + data.toString("hex")).toEqual(iface.encodeFunctionData("delegate", [42n]));
    expect(to).toEqual("0x0000000000000000000000000000000000001000");
    expect(value).toEqual(1000000000000000000n);
  });

  it("encodes a Monad compoundReward by valId with a zero msg.value (nonpayable)", () => {
    const intent = delegateIntent({
      mode: "compoundReward",
      amount: 0n,
      valId: "42",
      valAddress: "0xDisplayAddressIgnoredByEncoder",
    });

    const { to, data, value } = buildStakingTransactionParams(asCurrency("monad"), intent);

    const iface = new ethers.Interface(getStakingABI("monad") as ethers.InterfaceAbi);
    expect("0x" + data.toString("hex")).toEqual(iface.encodeFunctionData("compound", [42n]));
    expect(to).toEqual("0x0000000000000000000000000000000000001000");
    expect(value).toEqual(0n);
  });

  it("throws when a Monad delegate intent has no valId", () => {
    expect(() => {
      buildStakingTransactionParams(asCurrency("monad"), delegateIntent({}));
    }).toThrow("monad staking requires valId");
  });

  it("encodes a Monad withdraw by (valId, withdrawId) with no value", () => {
    const intent = delegateIntent({
      mode: "withdraw",
      valId: "42",
      withdrawId: "7",
      valAddress: "0xDisplayAddressIgnoredByEncoder",
    });

    const { to, data, value } = buildStakingTransactionParams(asCurrency("monad"), intent);

    const iface = new ethers.Interface(getStakingABI("monad") as ethers.InterfaceAbi);
    expect("0x" + data.toString("hex")).toEqual(iface.encodeFunctionData("withdraw", [42n, 7n]));
    expect(to).toEqual("0x0000000000000000000000000000000000001000");
    expect(value).toEqual(0n);
  });

  it("throws when a Monad withdraw intent has no withdrawId", () => {
    expect(() => {
      buildStakingTransactionParams(
        asCurrency("monad"),
        delegateIntent({ mode: "withdraw", valId: "42" }),
      );
    }).toThrow("monad withdraw requires withdrawId");
  });

  it("still encodes a Sei delegate by valAddress (valId ignored)", () => {
    const valAddress = "seivaloper1y82m5y3wevjneamzg0pmx87dzanyxzht0kepvn";
    const intent = delegateIntent({ valAddress });

    const { to, data, value } = buildStakingTransactionParams(asCurrency("sei_evm"), intent);

    const iface = new ethers.Interface(getStakingABI("sei_evm") as ethers.InterfaceAbi);
    expect("0x" + data.toString("hex")).toEqual(iface.encodeFunctionData("delegate", [valAddress]));
    expect(to).toEqual("0x0000000000000000000000000000000000001005");
    expect(value).toEqual(1000000000000000000n);
  });

  it("routes Sei claimReward to the distribution precompile (0x1007)", () => {
    const valAddress = "seivaloper1y82m5y3wevjneamzg0pmx87dzanyxzht0kepvn";
    const intent = delegateIntent({ mode: "claimReward", valAddress });

    const { to } = buildStakingTransactionParams(asCurrency("sei_evm"), intent);

    expect(to).toEqual("0x0000000000000000000000000000000000001007");
  });

  it.each([
    ["sei_evm", { valAddress: "seivaloper1y82m5y3wevjneamzg0pmx87dzanyxzht0kepvn" }],
    ["monad", { valId: "42", valAddress: "0xDisplayAddressIgnoredByEncoder" }],
  ])("ignores txValue for '%s'", (currencyId, fields) => {
    const intent = delegateIntent({ ...fields, txValue: 999n });

    const { value } = buildStakingTransactionParams(asCurrency(currencyId), intent);

    expect(value).toEqual(1000000000000000000n);
  });
});

describe("0G / zero_gravity delegate", () => {
  it("encodes sender as the delegate(address) arg, routes to valAddress, carries amount as value", () => {
    const intent = delegateIntent({
      valAddress: "0x0000000000000000000000000000000000000001",
      sender: "0x0000000000000000000000000000000000000002",
    });

    const { to, data, value } = buildStakingTransactionParams(asCurrency("zero_gravity"), intent);

    const iface = new ethers.Interface(getStakingABI("zero_gravity") as ethers.InterfaceAbi);
    expect("0x" + data.toString("hex")).toEqual(
      iface.encodeFunctionData("delegate", ["0x0000000000000000000000000000000000000002"]),
    );
    expect(to).toEqual("0x0000000000000000000000000000000000000001");
    expect(value).toEqual(1000000000000000000n);
  });

  it("throws when valAddress is missing", () => {
    expect(() => {
      buildStakingTransactionParams(asCurrency("zero_gravity"), delegateIntent({}));
    }).toThrow("0G staking requires a validator address");
  });

  it("throws when delegator is missing", () => {
    expect(() => {
      buildStakingTransactionParams(
        asCurrency("zero_gravity"),
        delegateIntent({ valAddress: "0x0000000000000000000000000000000000000001", sender: "" }),
      );
    }).toThrow("zero_gravity staking requires delegator");
  });
});

describe("0G / zero_gravity undelegate", () => {
  const VAL = "0x0000000000000000000000000000000000000001";
  const DELEGATOR = "0x0000000000000000000000000000000000000002";

  it("encodes undelegate(withdrawalAddress, shares), routes to valAddress, carries txValue as msg.value", () => {
    const intent = delegateIntent({
      mode: "undelegate",
      valAddress: VAL,
      sender: DELEGATOR,
      amount: 1_000_000_000n,
      shares: 1_500_000_000n,
      txValue: 50_000_000_000n,
    });

    const { to, data, value } = buildStakingTransactionParams(asCurrency("zero_gravity"), intent);

    const iface = new ethers.Interface(getStakingABI("zero_gravity") as ethers.InterfaceAbi);
    expect("0x" + data.toString("hex")).toEqual(
      iface.encodeFunctionData("undelegate", [DELEGATOR, 1_500_000_000n]),
    );
    expect(to).toEqual(VAL);
    expect(value).toEqual(50_000_000_000n);
  });

  it("throws when shares is missing", () => {
    expect(() => {
      buildStakingTransactionParams(
        asCurrency("zero_gravity"),
        delegateIntent({ mode: "undelegate", valAddress: VAL }),
      );
    }).toThrow("zero_gravity undelegate requires shares");
  });
});

describe("0G / zero_gravity contractAddress resolver", () => {
  const config = STAKING_CONTRACTS["zero_gravity"];

  it("returns valAddress when provided", () => {
    expect(config.contractAddress({ mode: "delegate", valAddress: "0xValidatorAddr" })).toEqual(
      "0xValidatorAddr",
    );
  });

  it("throws when valAddress is missing", () => {
    expect(() => config.contractAddress({ mode: "delegate" })).toThrow(
      "0G staking requires a validator address",
    );
  });

  it("throws when ctx is undefined", () => {
    expect(() => config.contractAddress()).toThrow("0G staking requires a validator address");
  });
});

describe("0G / zero_gravity value resolver", () => {
  const config = STAKING_CONTRACTS["zero_gravity"];

  it.each([
    [{ mode: "delegate", amount: 1000n }, 1000n],
    [{ mode: "undelegate", amount: 1000n, txValue: 50n }, 50n],
    [{ mode: "undelegate", amount: 1000n }, 0n],
  ] as const)("value(%o) returns %s", (ctx, expected) => {
    expect(config.value(ctx)).toEqual(expected);
  });
});
