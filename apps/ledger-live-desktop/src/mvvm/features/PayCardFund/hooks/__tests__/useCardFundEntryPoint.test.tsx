import { act, renderHook } from "tests/testSetup";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { CardAssetRow } from "@features/flow-pay-card-assets";
import { useOpenAssetAndAccount } from "LLD/features/ModularDialog/Web3AppWebview/AssetAndAccountDrawer";
import { openCardFund } from "../../screens/CardFund/CardFundDialog";
import { useCardFundEntryPoint } from "../useCardFundEntryPoint";

jest.mock("LLD/features/ModularDialog/Web3AppWebview/AssetAndAccountDrawer");
jest.mock("../../screens/CardFund/CardFundDialog", () => ({
  openCardFund: jest.fn(),
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
  const { result } = renderHook(() => useCardFundEntryPoint());

  act(() => result.current(asset));

  expect(openAssetAndAccount).toHaveBeenCalledWith(
    expect.objectContaining({
      currencies: [asset.ledgerId],
      areCurrenciesFiltered: true,
      uiUseCase: "pay-card-fund",
    }),
  );
});

it("hands the selected source account and linked destination to Fund", () => {
  const account = genAccount("source-account");
  const { result } = renderHook(() => useCardFundEntryPoint());

  act(() => result.current(asset));
  const { onSuccess } = openAssetAndAccount.mock.calls[0][0];
  act(() => onSuccess(account));

  expect(openCardFund).toHaveBeenCalledWith({
    account,
    parentAccount: undefined,
    asset,
  });
});

it.each([
  ["an unmapped asset", ""],
  ["an asset Fund is not verified for", "ethereum/erc20/usd__coin"],
])("does not open an account picker for %s", (_, ledgerId) => {
  const { result } = renderHook(() => useCardFundEntryPoint());

  act(() => result.current({ ...asset, ledgerId }));

  expect(openAssetAndAccount).not.toHaveBeenCalled();
});
