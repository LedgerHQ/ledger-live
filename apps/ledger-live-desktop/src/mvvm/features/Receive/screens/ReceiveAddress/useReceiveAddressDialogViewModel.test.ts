import type { Account } from "@ledgerhq/types-live";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import {
  LegacyAccountEntrySchema,
  accountsSlice,
  legacyAccountsSynced,
} from "@domain/entity-account";
import { mockAccountEntry } from "@domain/entity-account/schema.mock";
import { CryptoOrTokenCurrencyIdSchema } from "@domain/entity-currency";
import { mockReceiveFamilyConfigInput } from "@features/flow-receive/types.mock";
import { useFilteredServiceStatus } from "@ledgerhq/live-common/notifications/ServiceStatusProvider/index";
import { http, HttpResponse, server } from "tests/server";
import { renderHook, waitFor } from "tests/testSetup";
import { useLLDCoinFamily } from "~/renderer/families";
import { VerifyAddressExecutorLWD } from "../../verifyAddressIntent/VerifyAddressExecutorLWD";
import { useReceiveAddressDialogViewModel } from "./useReceiveAddressDialogViewModel";

jest.mock("~/renderer/families", () => ({ useLLDCoinFamily: jest.fn() }));
jest.mock("@ledgerhq/live-common/notifications/ServiceStatusProvider/index", () => ({
  useFilteredServiceStatus: jest.fn(() => ({ incidents: [] })),
}));

const entry = LegacyAccountEntrySchema.parse(mockAccountEntry());
const ethAccount: Account = {
  ...genAccount("eth", { currency: getCryptoCurrencyById("ethereum") }),
  id: entry.legacyId,
};
const target = {
  accountUUID: entry.accountUUID,
  assetId: CryptoOrTokenCurrencyIdSchema.parse("ethereum"),
};

const USDC_ID = CryptoOrTokenCurrencyIdSchema.parse("ethereum/erc20/usd__coin");

const serveUsdc = () =>
  server.use(
    http.get("*/v1/tokens", () =>
      HttpResponse.json([
        {
          id: USDC_ID,
          contract_address: "0xA0b86991c6218b36c1D19D4a2e9Eb0cE3606eB48",
          standard: "erc20",
          decimals: 6,
          delisted: false,
          name: "USD Coin",
          ticker: "USDC",
          units: [{ name: "USD Coin", code: "USDC", magnitude: 6 }],
        },
      ]),
    ),
  );

const renderViewModel = (assetId = target.assetId) =>
  renderHook(() => useReceiveAddressDialogViewModel({ ...target, assetId }), {
    initialState: {
      accountEntries: accountsSlice.reducer(undefined, legacyAccountsSynced([entry])),
      accounts: [ethAccount],
      receiveAddressDialog: { target },
    },
  });

describe("useReceiveAddressDialogViewModel", () => {
  it("should give the screen the desktop verification and clipboard", () => {
    jest.mocked(useLLDCoinFamily).mockReturnValue({});
    const { result } = renderViewModel();

    expect(result.current).toEqual(
      expect.objectContaining({
        ...target,
        VerifyAddressExecutor: VerifyAddressExecutorLWD,
        onCopyAddress: expect.any(Function),
        getFamilyConfig: undefined,
        onResolveGate: undefined,
      }),
    );
    expect(result.current.onShareAddress).toBeUndefined();
  });

  it("should read the family config with the legacy account the family still needs", () => {
    const receiveAddressConfig = jest.fn(() => ({ notices: ["utxo" as const] }));
    jest.mocked(useLLDCoinFamily).mockReturnValue({ receiveAddressConfig });
    const { result } = renderViewModel();
    const { asset } = mockReceiveFamilyConfigInput();

    expect(result.current.getFamilyConfig?.({ asset })).toEqual({ notices: ["utxo"] });
    expect(useLLDCoinFamily).toHaveBeenCalledWith("evm");
    expect(receiveAddressConfig).toHaveBeenCalledWith(
      expect.objectContaining({ asset, legacyAccount: ethAccount }),
    );
  });

  it("should give the incidents the app keeps for the network", () => {
    jest.mocked(useLLDCoinFamily).mockReturnValue({});
    jest.mocked(useFilteredServiceStatus).mockReturnValue({
      incidents: [
        { name: "Ethereum degraded", incident_updates: [{ body: "Investigating" }] },
        { name: "Explorer down" },
      ],
    } as unknown as ReturnType<typeof useFilteredServiceStatus>);
    const { result } = renderViewModel();

    expect(useFilteredServiceStatus).toHaveBeenCalledWith({ tickers: ["ETH"], entryPoint: "flow" });
    expect(result.current.serviceIncidents).toEqual([
      { title: "Ethereum degraded", description: [{ text: "Investigating" }] },
      { title: "Explorer down", description: undefined },
    ]);
  });

  it("should keep the Ledger links of an incident update, and others as text", () => {
    jest.mocked(useLLDCoinFamily).mockReturnValue({});
    jest.mocked(useFilteredServiceStatus).mockReturnValue({
      incidents: [
        {
          name: "Ethereum degraded",
          incident_updates: [
            {
              body: 'Delays. See <a href="https://support.ledger.com/x">our article</a> or <a href="https://evil.example">this</a>.',
            },
          ],
        },
      ],
    } as unknown as ReturnType<typeof useFilteredServiceStatus>);
    const { result } = renderViewModel();

    expect(result.current.serviceIncidents?.[0].description).toEqual([
      { text: "Delays. See " },
      { text: "our article", url: "https://support.ledger.com/x" },
      { text: " or " },
      { text: "this" },
      { text: "." },
    ]);
  });

  it("should close the dialog, then open the family flow the account needs to receive", () => {
    const receiveGateAction = jest.fn();
    jest.mocked(useLLDCoinFamily).mockReturnValue({ receiveGateAction });
    const { result, store } = renderViewModel();

    result.current.onResolveGate?.(jest.fn());

    expect(store.getState().receiveAddressDialog.target).toBeNull();
    expect(receiveGateAction).toHaveBeenCalledWith({
      account: ethAccount,
      token: undefined,
      dispatch: store.dispatch,
    });
  });

  it("should give the family flow the token the dialog receives", async () => {
    serveUsdc();
    const receiveGateAction = jest.fn();
    jest.mocked(useLLDCoinFamily).mockReturnValue({ receiveGateAction });
    const { result, store } = renderViewModel(USDC_ID);

    // Pressed again until the token is loaded: the family action gets it from then on.
    await waitFor(() => {
      result.current.onResolveGate?.(jest.fn());
      expect(receiveGateAction).toHaveBeenLastCalledWith(
        expect.objectContaining({ token: expect.anything() }),
      );
    });

    expect(store.getState().receiveAddressDialog.target).toBeNull();
    expect(receiveGateAction).toHaveBeenLastCalledWith({
      account: ethAccount,
      token: expect.objectContaining({ id: USDC_ID, ticker: "USDC" }),
      dispatch: store.dispatch,
    });
  });
});
