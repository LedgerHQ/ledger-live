import type { EvmCoinConfig } from "@ledgerhq/coin-evm/config";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { setCoinConfig } from "../../config";
import resolver from "../../signer/hw-getAddress";
import type { CeloSigner } from "../../signer/signer";

describe("hw-getAddress resolver", () => {
  it("passes the coin config's chain id to the signer, not the currency's stale chain id", async () => {
    // A deliberately non-default chain id: celo's own currency data (and its old
    // `ethereumLikeInfo.chainId`) is 42220, so getting this value back proves the
    // resolver reads the coin config and not the currency model.
    const configuredChainId = 999999;
    setCoinConfig(
      () => ({ info: { chainId: configuredChainId, name: "Celo" } }) as unknown as EvmCoinConfig,
    );

    const getAddress = jest.fn().mockResolvedValue({
      address: "0x0000000000000000000000000000000000000001",
      publicKey: "04ab",
    });
    const signer = { getAddress } as unknown as CeloSigner;
    const signerContext = (_deviceId: string, fn: (s: CeloSigner) => Promise<unknown>) =>
      fn(signer);

    const getAddressFn = resolver(signerContext as never);
    await getAddressFn("deviceId", {
      path: "44'/60'/0'/0'/0'",
      verify: false,
      currency: getCryptoCurrencyById("celo"),
    } as never);

    expect(getAddress).toHaveBeenCalledWith(
      "44'/60'/0'/0'/0'",
      false,
      false,
      configuredChainId.toString(),
    );
  });
});
