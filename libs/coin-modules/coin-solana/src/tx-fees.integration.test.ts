import { getChainAPI } from "./network";
import { estimateTxFee } from "./tx-fees";

const api = getChainAPI({
  endpoint: "https://solana.coin.ledger.com",
});

// const recipientAddress = "AQbkEagmPgmsdAfS4X8V8UyJnXXjVPMvjeD15etqQ3Jh";

describe("estimateTxFee", () => {
  it("retrieves the fee value for SPL 2022", async () => {
    // GIVEN
    // SPL 2022 FluxBot
    // const mintAddress = "FLUXBmPhT3Fd1EDVFdg46YREqHBeNypn1h4EbnTzWERX";
    const ownerAddress = "4t2PwHr22SxRMN4kaoGWjUdVuhEggyXxjSw2a5BHZqro";

    // // WHEN
    const fee = await estimateTxFee(api, ownerAddress, "token.transfer");

    // THEN
    expect(fee).toEqual(5000);
  });

  it("retrieves the fee value for SPL", async () => {
    // GIVEN
    // SPL TRUMP
    // const mintAddress = "6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN";
    const ownerAddress = "J88iiSwqYUGvH1kF3jpBdCqwcE5pMAndvKPnpU7KUMbW";

    // // WHEN
    const fee = await estimateTxFee(api, ownerAddress, "token.transfer");

    // THEN
    expect(fee).toEqual(5000);
  });
});
