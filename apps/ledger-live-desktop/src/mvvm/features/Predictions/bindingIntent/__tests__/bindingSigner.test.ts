import { from, lastValueFrom, toArray } from "rxjs";
import type { DeviceConnectionResult } from "@features/platform-device-intent";
import {
  runSignTypedDataEvm,
  type SignTypedDataEvmRunState,
} from "@ledgerhq/live-common/wallet-api/Exchange/intents/shared/signTypedDataEvm";
import type { Account } from "@ledgerhq/types-live";
import type { PredictionsTypedData } from "@features/platform-predictions";
import { signBindingTypedData } from "../bindingSigner";

jest.mock("@ledgerhq/live-common/wallet-api/Exchange/intents/shared/signTypedDataEvm");

const account = {
  type: "Account",
  id: "js:2:polygon:0xabc:",
  freshAddress: "0x9858EfFD232B4033E47d90003D41EC34EcaEda94",
  freshAddressPath: "44'/60'/0'/0/0",
  currency: { id: "polygon", family: "evm" },
} as Account;

describe("signBindingTypedData", () => {
  const connection = { sessionId: "session-1" } as DeviceConnectionResult;
  const typedData = { primaryType: "ConfirmAccountOwnership" } as PredictionsTypedData;
  const runSigning = jest.mocked(runSignTypedDataEvm);

  beforeEach(() => {
    runSigning.mockReset();
  });

  it("signs the typed data with the account in the session, telling when the device asks to confirm", async () => {
    const states: SignTypedDataEvmRunState[] = [
      { type: "loading-context" },
      { type: "awaiting-confirmation" },
      { type: "signing" },
      { type: "signed", signatureHex: "0x1234" },
    ];
    runSigning.mockReturnValue(from(states));

    await expect(
      lastValueFrom(signBindingTypedData(connection, account, typedData).pipe(toArray())),
    ).resolves.toEqual([
      { type: "awaiting-confirmation" },
      { type: "awaiting-confirmation" },
      { type: "signed", signature: "0x1234" },
    ]);
    expect(runSigning).toHaveBeenCalledWith(
      connection,
      typedData,
      account.freshAddressPath,
      expect.any(String),
    );
  });

  it("fails with the device error", async () => {
    const refusal = Object.assign(new Error("refused"), { name: "UserRefusedOnDevice" });
    const states: SignTypedDataEvmRunState[] = [{ type: "failed", error: refusal }];
    runSigning.mockReturnValue(from(states));

    await expect(lastValueFrom(signBindingTypedData(connection, account, typedData))).rejects.toBe(
      refusal,
    );
  });
});
