import type { Account } from "@ledgerhq/types-live";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { accountsSlice, legacyAccountsSynced } from "@domain/entity-account";
import { mockLegacyAccountEntry } from "@domain/entity-account/schema.mock";
import { CryptoOrTokenCurrencyIdSchema } from "@domain/entity-currency";
import { mockReceiveFamilyConfigInput } from "@features/flow-receive/types.mock";
import { useFilteredServiceStatus } from "@ledgerhq/live-common/notifications/ServiceStatusProvider/index";
import { renderHook } from "tests/testSetup";
import { useLLDCoinFamily } from "~/renderer/families";
import { VerifyAddressExecutorLWD } from "../../verifyAddressIntent/VerifyAddressExecutorLWD";
import { useReceiveAddressDialogViewModel } from "./useReceiveAddressDialogViewModel";

jest.mock("~/renderer/families", () => ({ useLLDCoinFamily: jest.fn() }));
jest.mock("@ledgerhq/live-common/notifications/ServiceStatusProvider/index", () => ({
  useFilteredServiceStatus: jest.fn(() => ({ incidents: [] })),
}));

const entry = mockLegacyAccountEntry();
const ethAccount: Account = {
  ...genAccount("eth", { currency: getCryptoCurrencyById("ethereum") }),
  id: entry.legacyId,
};
const target = {
  accountUUID: entry.accountUUID,
  assetId: CryptoOrTokenCurrencyIdSchema.parse("ethereum"),
};

const renderViewModel = () =>
  renderHook(() => useReceiveAddressDialogViewModel(target), {
    initialState: {
      accountEntries: accountsSlice.reducer(undefined, legacyAccountsSynced([entry])),
      accounts: [ethAccount],
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
      }),
    );
    expect(result.current.onShareAddress).toBeUndefined();
  });

  it("should read the family config with the legacy account the family still needs", () => {
    const receiveAddressConfig = jest.fn(() => ({ notices: ["utxo" as const] }));
    jest.mocked(useLLDCoinFamily).mockReturnValue({ receiveAddressConfig });
    const { result } = renderViewModel();
    const { account, asset } = mockReceiveFamilyConfigInput();

    expect(result.current.getFamilyConfig?.({ account, asset })).toEqual({ notices: ["utxo"] });
    expect(useLLDCoinFamily).toHaveBeenCalledWith("evm");
    expect(receiveAddressConfig).toHaveBeenCalledWith(
      expect.objectContaining({ account, asset, legacyAccount: ethAccount }),
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
});
