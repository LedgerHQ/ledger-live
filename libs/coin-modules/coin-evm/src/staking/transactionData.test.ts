import { ethers } from "ethers";
import { MemoNotSupported } from "@ledgerhq/coin-module-framework/api/index";
import { TransactionIntent, BufferTxData } from "@ledgerhq/coin-module-framework/api/types";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getStakingABI } from "./abis";
import { buildStakingTransactionParams } from "./transactionData";

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
    feesStrategy: "medium",
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

  it("still encodes a Sei delegate by valAddress (valId ignored)", () => {
    const valAddress = "seivaloper1y82m5y3wevjneamzg0pmx87dzanyxzht0kepvn";
    const intent = delegateIntent({ valAddress });

    const { to, data, value } = buildStakingTransactionParams(asCurrency("sei_evm"), intent);

    const iface = new ethers.Interface(getStakingABI("sei_evm") as ethers.InterfaceAbi);
    expect("0x" + data.toString("hex")).toEqual(iface.encodeFunctionData("delegate", [valAddress]));
    expect(to).toEqual("0x0000000000000000000000000000000000001005");
    expect(value).toEqual(1000000000000000000n);
  });
});
