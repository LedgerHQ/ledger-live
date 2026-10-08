import React from "react";
import BigNumber from "bignumber.js";
import type { TokenAccount } from "@ledgerhq/types-live";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { ConfidentialErrorCode } from "@ledgerhq/coin-evm/confidential";
import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { render, screen, waitFor } from "tests/testSetup";
import { usdcToken } from "LLD/features/__mocks__/useSelectAssetFlow.mock";
import { ShieldModal } from "../components/ShieldModal";
import { confidentialApi, DeviceRefusedError, mockControls } from "../utils/confidentialApi";
import { getShieldExecutor, type ShieldExecutor } from "../utils/shieldExecutor";

jest.mock("../utils/confidentialApi", () => {
  const actual = jest.requireActual("../utils/confidentialApi");
  const { createMockConfidentialApi } = jest.requireActual("@ledgerhq/coin-evm/confidential");
  const holder = { api: createMockConfidentialApi({ delayMs: 0 }) };
  return {
    ...actual,
    get confidentialApi() {
      return holder.api;
    },
    mockControls: {
      failNext: (code: ConfidentialErrorCode) => holder.api.failNext(code),
      reset: () => {
        holder.api = createMockConfidentialApi({ delayMs: 0 });
      },
    },
  };
});
jest.mock("../utils/shieldExecutor", () => ({ getShieldExecutor: jest.fn() }));

const USDC_MOCK = "0x9b5Cd13b8eFbB58Dc25A05CF411D8056058aDFfF";
const CUSDC_MOCK = "0x7c5BF43B851c1dff1a4feE8dB225b87f2C223639";
const OWNER = "0x0a10000000000000000000000000000000009e33";

const usdcMock: TokenCurrency = {
  ...usdcToken,
  id: "ethereum_sepolia/erc20/usdcmock" as TokenCurrency["id"],
  contractAddress: USDC_MOCK,
  parentCurrencyId: "ethereum_sepolia" as TokenCurrency["parentCurrencyId"],
  name: "USDCMock",
  ticker: "USDCMock",
  units: [{ name: "USDCMock", code: "USDCMock", magnitude: 6 }],
};

const controls = mockControls as typeof mockControls & { reset: () => void };

function createExecutor(failures: Partial<Record<"approve" | "wrap", unknown>> = {}) {
  const pendingFailures = { ...failures };
  const signed: string[] = [];
  const executor: ShieldExecutor = {
    signAndBroadcast: jest.fn(async step => {
      const failure = pendingFailures[step];
      if (failure) {
        delete pendingFailures[step];
        throw failure;
      }
      signed.push(step);
      return `0x${step === "approve" ? "a" : "b"}${"0".repeat(63)}`;
    }),
    waitForConfirmation: jest.fn(async () => undefined),
  };
  jest.mocked(getShieldExecutor).mockReturnValue(executor);
  return { executor, signed };
}

function setup() {
  const parentAccount = genAccount("shield-parent", {
    currency: getCryptoCurrencyById("ethereum_sepolia"),
  });
  const account: TokenAccount = {
    ...genTokenAccount(0, parentAccount, usdcMock),
    balance: new BigNumber(75_000_000),
  };
  const onClose = jest.fn();
  const onShielded = jest.fn();
  const signTransaction = jest.fn();
  const result = render(
    <ShieldModal
      account={account}
      owner={OWNER}
      pair={{ underlying: USDC_MOCK, wrapper: CUSDC_MOCK, rate: 1n, wrapperDecimals: 6 }}
      createConfidentialClient={jest.fn()}
      signTransaction={signTransaction}
      onClose={onClose}
      onShielded={onShielded}
    />,
  );
  return { ...result, onClose, onShielded, signTransaction };
}

beforeEach(() => {
  controls.reset();
  const modalsRoot = document.createElement("div");
  modalsRoot.id = "modals";
  document.body.appendChild(modalsRoot);
});

afterEach(() => {
  document.getElementById("modals")?.remove();
});

describe("ShieldModal", () => {
  it("shows the public balance and names the wrapper before anything is signed", () => {
    const { executor } = createExecutor();
    setup();

    expect(screen.getByTestId("confidential-shield-available")).toHaveTextContent(
      "Public balance: 75 USDCMock",
    );
    expect(screen.getByText(/confidential wrapper 0x7c5B…3639/)).toBeVisible();
    expect(screen.getByTestId("confidential-shield-submit")).toBeDisabled();
    expect(executor.signAndBroadcast).not.toHaveBeenCalled();
  });

  it.each([
    ["76", "This is more than your public balance."],
    ["0", "Enter an amount greater than 0."],
  ])("refuses %s before preparing anything", async (amount, message) => {
    createExecutor();
    const { user } = setup();

    await user.type(screen.getByTestId("confidential-shield-amount"), amount);

    expect(screen.getByTestId("confidential-shield-amount-error")).toHaveTextContent(message);
    expect(screen.getByTestId("confidential-shield-submit")).toBeDisabled();
  });

  it("fills the whole public balance with Max", async () => {
    createExecutor();
    const { user } = setup();

    await user.click(screen.getByText("Max"));

    expect(screen.getByTestId("confidential-shield-amount")).toHaveValue("75");
  });

  it("signs approve, waits for its confirmation, then signs wrap", async () => {
    const { executor, signed } = createExecutor();
    const { user, onShielded } = setup();

    await user.type(screen.getByTestId("confidential-shield-amount"), "1.5");
    await user.click(screen.getByTestId("confidential-shield-submit"));

    expect(await screen.findByTestId("confidential-shield-done")).toHaveTextContent(
      "1.5 USDCMock moved into your private balance",
    );
    expect(signed).toEqual(["approve", "wrap"]);
    expect(executor.waitForConfirmation).toHaveBeenNthCalledWith(1, `0xa${"0".repeat(63)}`);
    expect(executor.waitForConfirmation).toHaveBeenNthCalledWith(2, `0xb${"0".repeat(63)}`);
    expect(screen.getByTestId("confidential-shield-phase-approve")).toHaveTextContent("Done");
    expect(screen.getByTestId("confidential-shield-phase-wrap")).toHaveTextContent("Done");
    expect(onShielded).toHaveBeenCalledTimes(1);
  });

  it("hands the device signer to the executor", async () => {
    createExecutor();
    const { user, signTransaction } = setup();

    await user.type(screen.getByTestId("confidential-shield-amount"), "1");
    await user.click(screen.getByTestId("confidential-shield-submit"));

    expect(await screen.findByTestId("confidential-shield-done")).toBeVisible();
    expect(getShieldExecutor).toHaveBeenCalledWith(
      expect.objectContaining({ currencyId: "ethereum_sepolia", signTransaction }),
    );
  });

  it("signs only wrap when the allowance already covers the amount", async () => {
    const { signed } = createExecutor();
    const prepare = confidentialApi.prepareShield;
    jest.spyOn(confidentialApi, "prepareShield").mockImplementationOnce(async (...args) => {
      const prepared = await prepare(...args);
      return { ...prepared, transactions: [null, prepared.transactions[1]] };
    });
    const { user, onShielded } = setup();

    await user.type(screen.getByTestId("confidential-shield-amount"), "1");
    await user.click(screen.getByTestId("confidential-shield-submit"));

    expect(await screen.findByTestId("confidential-shield-done")).toBeVisible();
    expect(signed).toEqual(["wrap"]);
    expect(screen.getByTestId("confidential-shield-phase-approve")).toHaveTextContent("Done");
    expect(onShielded).toHaveBeenCalledTimes(1);
  });

  it("resumes at wrap after a refusal, without signing approve again", async () => {
    const { signed } = createExecutor({ wrap: new DeviceRefusedError() });
    const { user, onShielded } = setup();

    await user.type(screen.getByTestId("confidential-shield-amount"), "1");
    await user.click(screen.getByTestId("confidential-shield-submit"));

    expect(await screen.findByTestId("confidential-shield-error-deviceRefused")).toBeVisible();
    expect(screen.getByTestId("confidential-shield-phase-approve")).toHaveTextContent("Done");
    expect(screen.getByTestId("confidential-shield-phase-wrap")).toHaveTextContent("Failed");
    expect(onShielded).not.toHaveBeenCalled();

    await user.click(screen.getByText("Retry"));

    expect(await screen.findByTestId("confidential-shield-done")).toBeVisible();
    expect(signed).toEqual(["approve", "wrap"]);
    expect(onShielded).toHaveBeenCalledTimes(1);
  });

  it("prepares the shield again on retry, so a spent nonce is never signed twice", async () => {
    createExecutor({ wrap: new DeviceRefusedError() });
    const prepareShield = jest.spyOn(confidentialApi, "prepareShield");
    const { user } = setup();

    await user.type(screen.getByTestId("confidential-shield-amount"), "1");
    await user.click(screen.getByTestId("confidential-shield-submit"));
    expect(await screen.findByTestId("confidential-shield-error-deviceRefused")).toBeVisible();

    await user.click(screen.getByText("Retry"));

    expect(await screen.findByTestId("confidential-shield-done")).toBeVisible();
    expect(prepareShield).toHaveBeenCalledTimes(2);
    expect(prepareShield.mock.calls[1][2]).toMatchObject({ amount: 1_000_000n });
  });

  it("stays on the amount when the shield cannot be prepared, and retries it", async () => {
    const { executor } = createExecutor();
    controls.failNext("Denylisted");
    const { user } = setup();

    await user.type(screen.getByTestId("confidential-shield-amount"), "1");
    await user.click(screen.getByTestId("confidential-shield-submit"));

    expect(await screen.findByTestId("confidential-shield-error-denylisted")).toBeVisible();
    expect(screen.getByTestId("confidential-shield-amount")).toBeVisible();
    expect(executor.signAndBroadcast).not.toHaveBeenCalled();

    await user.click(screen.getByText("Retry"));

    await waitFor(() => expect(screen.getByTestId("confidential-shield-done")).toBeVisible());
  });
});
