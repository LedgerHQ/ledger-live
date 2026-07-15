import { afterEach, describe, expect, it, spyOn } from "bun:test";
import type { CommandOutput } from "../../../output";
import type { WalletAdapter } from "../../index";
import type { AccountDescriptor } from "../../models";
import * as ethVaultPipeline from "../eth-vault-pipeline";
import * as solStake from "../sol-stake";
import type { EarnDepositResult } from "../types";
import { evmEarnAdapter } from "./evm";
import { solanaEarnAdapter } from "./solana";
import {
  getEarnFamilyAdapter,
  supportedEarnFamilies,
  type EarnDepositArgs,
  type EarnWithdrawArgs,
} from "./index";

const descriptor = { id: "acc-1", currencyId: "ethereum" } as unknown as AccountDescriptor;
const wallet = {} as unknown as WalletAdapter;
const out = {} as unknown as CommandOutput;

// Base withdraw args with both required flags missing; each test sets only what it needs. The guards
// throw before any pipeline/HTTP call, so no wallet/device wiring is required.
const baseWithdrawArgs: EarnWithdrawArgs = {
  descriptor,
  network: "ethereum:main",
  finalize: false,
  dryRun: true,
  wallet,
  out,
};

describe("earn family adapter registry", () => {
  it("maps the supported families to their adapters", () => {
    expect(getEarnFamilyAdapter("evm")).toBe(evmEarnAdapter);
    expect(getEarnFamilyAdapter("solana")).toBe(solanaEarnAdapter);
  });

  it("returns undefined for an unsupported family", () => {
    expect(getEarnFamilyAdapter("bitcoin")).toBeUndefined();
  });

  it("lists the supported families in registration order", () => {
    expect(supportedEarnFamilies()).toEqual(["evm", "solana"]);
  });
});

describe("EVM adapter required-flag guard", () => {
  it("rejects a withdraw with no --product before touching the pipeline", () => {
    expect(() => evmEarnAdapter.withdraw(baseWithdrawArgs)).toThrow(
      /EVM withdraw requires --product/,
    );
  });
});

describe("Solana adapter required-flag guard", () => {
  it("rejects a withdraw with no --stake-account before touching the pipeline", () => {
    expect(() => solanaEarnAdapter.withdraw(baseWithdrawArgs)).toThrow(
      /Solana withdraw requires --stake-account/,
    );
  });
});

// The deposit adapters carry no required-flag guards (the command's Zod schema makes --product and
// --amount mandatory), so these assert the family-specific argument mapping: each adapter forwards
// the generic `product` onto the field its pipeline expects (EVM `productId`, Solana `validator`).
describe("earn family adapter deposit routing", () => {
  const baseDepositArgs: EarnDepositArgs = {
    descriptor,
    network: "ethereum:main",
    product: "the-product",
    amount: "100 USDC",
    dryRun: true,
    wallet,
    out,
  };
  const sentinel = { family: "stub" } as unknown as EarnDepositResult;

  afterEach(() => {
    spyOn(ethVaultPipeline, "depositEvm").mockRestore();
    spyOn(solStake, "depositSolana").mockRestore();
  });

  it("EVM: forwards the deposit through depositEvm with product mapped to productId", async () => {
    const depositEvm = spyOn(ethVaultPipeline, "depositEvm").mockResolvedValue(sentinel);

    const result = await evmEarnAdapter.deposit(baseDepositArgs);

    expect(result).toBe(sentinel);
    expect(depositEvm).toHaveBeenCalledTimes(1);
    expect(depositEvm.mock.calls[0][0]).toMatchObject({
      descriptor,
      network: "ethereum:main",
      productId: "the-product",
      amount: "100 USDC",
      dryRun: true,
    });
  });

  it("Solana: forwards the deposit through depositSolana with product mapped to validator", async () => {
    const depositSolana = spyOn(solStake, "depositSolana").mockResolvedValue(sentinel);

    const result = await solanaEarnAdapter.deposit({ ...baseDepositArgs, network: "solana:main" });

    expect(result).toBe(sentinel);
    expect(depositSolana).toHaveBeenCalledTimes(1);
    expect(depositSolana.mock.calls[0][0]).toMatchObject({
      descriptor,
      network: "solana:main",
      validator: "the-product",
      amount: "100 USDC",
      dryRun: true,
    });
  });
});
