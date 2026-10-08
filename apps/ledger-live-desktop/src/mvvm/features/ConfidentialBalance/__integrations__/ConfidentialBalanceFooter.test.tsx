import React from "react";
import type { TokenAccount } from "@ledgerhq/types-live";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { ConfidentialErrorCode } from "@ledgerhq/coin-evm/confidential";
import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { render, screen, waitFor } from "tests/testSetup";
import { usdcToken } from "LLD/features/__mocks__/useSelectAssetFlow.mock";
import { ConfidentialBalanceFooter } from "LLD/features/ConfidentialBalance";
import { confidentialApi, mockControls, mockSignTypedData } from "../utils/confidentialApi";
import { clearSessionBalances } from "../utils/sessionBalances";

jest.mock("../utils/confidentialApi", () => {
  const actual = jest.requireActual("../utils/confidentialApi");
  const { createMockConfidentialApi } = jest.requireActual("@ledgerhq/coin-evm/confidential");
  const holder = { api: createMockConfidentialApi({ delayMs: 0 }), refuseNext: false };
  return {
    ...actual,
    get confidentialApi() {
      return holder.api;
    },
    mockSignTypedData: jest.fn(async () => {
      if (holder.refuseNext) {
        holder.refuseNext = false;
        throw new actual.DeviceRefusedError();
      }
      return `0x${"00".repeat(65)}`;
    }),
    mockControls: {
      failNext: (code: ConfidentialErrorCode) => holder.api.failNext(code),
      refuseNextSignature: () => {
        holder.refuseNext = true;
      },
      reset: () => {
        holder.api = createMockConfidentialApi({ delayMs: 0 });
        holder.refuseNext = false;
      },
    },
  };
});

const USDC_MOCK = "0x9b5Cd13b8eFbB58Dc25A05CF411D8056058aDFfF";
const CUSDC_MOCK = "0x7c5BF43B851c1dff1a4feE8dB225b87f2C223639";

const usdcMock: TokenCurrency = {
  ...usdcToken,
  id: "ethereum_sepolia/erc20/usdcmock" as TokenCurrency["id"],
  contractAddress: USDC_MOCK,
  parentCurrencyId: "ethereum_sepolia" as TokenCurrency["parentCurrencyId"],
  name: "USDCMock",
  ticker: "USDCMock",
  units: [{ name: "USDCMock", code: "USDCMock", magnitude: 6 }],
};

function setup(token: TokenCurrency = usdcMock, currencyId = "ethereum_sepolia") {
  const parentAccount = genAccount("confidential-parent", {
    currency: getCryptoCurrencyById(currencyId),
  });
  const tokenAccount: TokenAccount = genTokenAccount(0, parentAccount, token);
  const result = render(
    <ConfidentialBalanceFooter account={tokenAccount} createConfidentialClient={createClient} />,
    {
      initialState: { accounts: [parentAccount] },
    },
  );
  return { ...result, tokenAccount };
}

const confidentialContext = {} as Parameters<typeof confidentialApi.prepareConfidentialSend>[0];

async function sendFromPrivatePart(amount: bigint) {
  await confidentialApi.prepareConfidentialSend(confidentialContext, "ethereum_sepolia", {
    sender: "0x0000000000000000000000000000000000000001",
    recipient: "0x0000000000000000000000000000000000000002",
    underlying: USDC_MOCK,
    amount,
    balance: {
      state: "decrypted",
      pair: { underlying: USDC_MOCK, wrapper: CUSDC_MOCK, rate: 1n, wrapperDecimals: 6 },
      handle: `0x${"00".repeat(32)}`,
      value: amount,
      underlyingValue: amount,
      updatedAt: 0,
    },
  });
}

const signer = mockSignTypedData as jest.Mock;
const createClient = jest.fn();
const controls = mockControls as typeof mockControls & { reset: () => void };

beforeEach(() => {
  controls.reset();
  clearSessionBalances();
  signer.mockClear();
});

describe("ConfidentialBalanceFooter", () => {
  it("shows the private part as undisclosed, never as zero, without prompting the device", async () => {
    setup();

    expect(await screen.findByTestId("confidential-undisclosed-badge")).toBeVisible();
    expect(screen.getByTestId("confidential-private-balance")).not.toHaveTextContent(/\b0\b/);
    expect(screen.queryByTestId("confidential-total")).not.toBeInTheDocument();
    expect(screen.getByTestId("confidential-permit-info")).toHaveTextContent(
      /decryption permit on your device for 0x7c5B…3639, valid 30 days/,
    );
    expect(signer).not.toHaveBeenCalled();
  });

  it("reveals the private balance after one device signature and shows the total", async () => {
    const { user } = setup();

    await user.click(await screen.findByTestId("confidential-reveal-button"));

    expect(await screen.findByTestId("confidential-total")).toBeVisible();
    expect(screen.getByTestId("confidential-private-balance")).toHaveTextContent("2.5 USDCMock");
    expect(screen.queryByTestId("confidential-undisclosed-badge")).not.toBeInTheDocument();
    expect(screen.getByTestId("confidential-permit-info")).toHaveTextContent(
      /Decryption permit valid until/,
    );
    expect(signer).toHaveBeenCalledTimes(1);
  });

  it("refreshes a revealed balance without a new signature while the permit is valid", async () => {
    const { user } = setup();
    await user.click(await screen.findByTestId("confidential-reveal-button"));

    await user.click(await screen.findByTestId("confidential-refresh-button"));

    await waitFor(() =>
      expect(screen.getByTestId("confidential-refresh-button")).not.toBeDisabled(),
    );
    expect(screen.getByTestId("confidential-private-balance")).toHaveTextContent("2.5 USDCMock");
    expect(signer).toHaveBeenCalledTimes(1);
  });

  it("marks a revealed balance as undisclosed again once its handle changes", async () => {
    const { user, rerender, tokenAccount } = setup();
    await user.click(await screen.findByTestId("confidential-reveal-button"));
    await screen.findByTestId("confidential-total");

    await sendFromPrivatePart(500_000n);
    rerender(
      <ConfidentialBalanceFooter
        account={{ ...tokenAccount, operationsCount: tokenAccount.operationsCount + 1 }}
        createConfidentialClient={createClient}
      />,
    );

    expect(await screen.findByTestId("confidential-undisclosed-badge")).toBeVisible();
    expect(screen.getByTestId("confidential-last-revealed")).toHaveTextContent(
      "Last revealed: 2.5 USDCMock",
    );
    expect(screen.queryByTestId("confidential-total")).not.toBeInTheDocument();
  });

  it("shows a device refusal and keeps the balance undisclosed", async () => {
    const { user } = setup();
    controls.refuseNextSignature();

    await user.click(await screen.findByTestId("confidential-reveal-button"));

    expect(await screen.findByTestId("confidential-error-deviceRefused")).toHaveTextContent(
      "The decryption permit was refused on your device.",
    );
    expect(screen.getByTestId("confidential-undisclosed-badge")).toBeVisible();
  });

  it.each([
    ["PermitExpired", "permitExpired"],
    ["PermitChainMismatch", "permitChainMismatch"],
    ["KmsContextRevoked", "kmsContextRevoked"],
    ["AclDenied", "aclDenied"],
    ["Denylisted", "denylisted"],
    ["RelayerError", "serviceUnavailable"],
    ["Unknown", "unknown"],
  ] as const)("renders its own message when the reveal fails with %s", async (code, kind) => {
    const { user } = setup();
    await screen.findByTestId("confidential-reveal-button");
    controls.failNext(code);

    await user.click(screen.getByTestId("confidential-reveal-button"));

    expect(await screen.findByTestId(`confidential-error-${kind}`)).toBeVisible();
  });

  it("lets the user retry when the private part cannot be read", async () => {
    controls.failNext("RelayerError");
    const { user } = setup();

    await user.click(await screen.findByText("Retry"));

    expect(await screen.findByTestId("confidential-undisclosed-badge")).toBeVisible();
    expect(screen.queryByTestId("confidential-error-serviceUnavailable")).not.toBeInTheDocument();
  });

  it("renders nothing for a token without a confidential wrapper", async () => {
    setup({ ...usdcMock, contractAddress: "0x1111111111111111111111111111111111111111" });

    await waitFor(() => expect(signer).not.toHaveBeenCalled());
    expect(screen.queryByTestId("confidential-balance-footer")).not.toBeInTheDocument();
  });

  it("opens the shield flow from the footer", async () => {
    const modalsRoot = document.createElement("div");
    modalsRoot.id = "modals";
    document.body.appendChild(modalsRoot);
    const { user } = setup();

    await user.click(await screen.findByTestId("confidential-shield-button"));

    expect(await screen.findByTestId("confidential-shield-amount")).toBeVisible();
    modalsRoot.remove();
  });

  it("never builds the real client while running on the mock", async () => {
    setup();

    await screen.findByTestId("confidential-undisclosed-badge");
    expect(createClient).not.toHaveBeenCalled();
  });

  it("renders nothing outside the networks that support confidential balances", () => {
    setup(
      { ...usdcMock, parentCurrencyId: "ethereum" as TokenCurrency["parentCurrencyId"] },
      "ethereum",
    );

    expect(screen.queryByTestId("confidential-balance-footer")).not.toBeInTheDocument();
  });
});
