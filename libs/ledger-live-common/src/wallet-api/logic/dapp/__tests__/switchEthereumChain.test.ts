import { dappSwitchEthereumChainLogic } from "../switchEthereumChain";
import type { DappSwitchEthereumChainContext } from "../switchEthereumChain";
import type { DappNetwork } from "../types";

function buildContext(): DappSwitchEthereumChainContext & {
  setCurrentAccount: jest.Mock;
  setCurrentAccountHist: jest.Mock;
} {
  return {
    manifest: { id: "dapp-1" } as never,
    setCurrentAccount: jest.fn(),
    setCurrentAccountHist: jest.fn(),
  };
}

const requestedCurrency = { currency: "ethereum", chainID: 1 } as DappNetwork;

describe("dappSwitchEthereumChainLogic", () => {
  it("requests an account filtered to the requested currency and resolves on success", async () => {
    const context = buildContext();
    const account = { id: "acc-1", freshAddress: "0xACC" } as never;
    const requestAccount = jest.fn().mockImplementation(({ onSuccess }) => onSuccess(account));

    await expect(
      dappSwitchEthereumChainLogic(context, requestedCurrency, requestAccount),
    ).resolves.toBeUndefined();

    expect(requestAccount).toHaveBeenCalledWith(
      expect.objectContaining({ currencyIds: ["ethereum"], areCurrenciesFiltered: true }),
    );
    expect(context.setCurrentAccountHist).toHaveBeenCalledWith("dapp-1", account);
    expect(context.setCurrentAccount).toHaveBeenCalledWith(account);
  });

  it('rejects with "User canceled" when the user cancels', async () => {
    const context = buildContext();
    const requestAccount = jest.fn().mockImplementation(({ onCancel }) => onCancel());

    await expect(
      dappSwitchEthereumChainLogic(context, requestedCurrency, requestAccount),
    ).rejects.toBe("User canceled");

    expect(context.setCurrentAccount).not.toHaveBeenCalled();
    expect(context.setCurrentAccountHist).not.toHaveBeenCalled();
  });
});
