import { act, renderHook } from "tests/testSetup";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { CardAssetRow } from "@features/flow-pay-card-assets";
import { useOpenAssetAndAccount } from "LLD/features/ModularDialog/Web3AppWebview/AssetAndAccountDrawer";
import { openCardTopUp } from "../../screens/CardTopUp/CardTopUpDialog";
import { useCardTopUpEntryPoint } from "../useCardTopUpEntryPoint";

jest.mock("LLD/features/ModularDialog/Web3AppWebview/AssetAndAccountDrawer");
jest.mock("../../screens/CardTopUp/CardTopUpDialog", () => ({
  openCardTopUp: jest.fn(),
}));

const asset: CardAssetRow = {
  id: "card-wallet",
  address: "bc1qcardwallet",
  currency: "btc",
  network: "bitcoin",
  name: "Bitcoin",
  ticker: "BTC",
  ledgerId: "bitcoin",
  cryptoAmount: "0.001 BTC",
  countervalue: "$50.00",
  countervalueAmount: 50,
};

const openAssetAndAccount = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useOpenAssetAndAccount).mockReturnValue({
    openAssetAndAccount,
    openAssetAndAccountPromise: jest.fn(),
  });
});

it("filters the source-account picker to the linked wallet asset", () => {
  const { result } = renderHook(() => useCardTopUpEntryPoint());

  act(() => result.current(asset));

  expect(openAssetAndAccount).toHaveBeenCalledWith(
    expect.objectContaining({
      currencies: [asset.ledgerId],
      areCurrenciesFiltered: true,
      uiUseCase: "pay-card-top-up",
    }),
  );
});

it("hands the selected source account and linked destination to the top-up", () => {
  const account = genAccount("source-account");
  const { result } = renderHook(() => useCardTopUpEntryPoint());

  act(() => result.current(asset));
  const { onSuccess } = openAssetAndAccount.mock.calls[0][0];
  act(() => onSuccess(account));

  expect(openCardTopUp).toHaveBeenCalledWith({
    account,
    parentAccount: undefined,
    asset,
  });
});

it.each([
  ["an unmapped asset", ""],
  ["an asset the top-up is not verified for", "ethereum/erc20/usd__coin"],
])("does not open an account picker for %s", (_, ledgerId) => {
  const { result } = renderHook(() => useCardTopUpEntryPoint());

  act(() => result.current({ ...asset, ledgerId }));

  expect(openAssetAndAccount).not.toHaveBeenCalled();
});
