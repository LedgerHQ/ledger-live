import { of, throwError } from "rxjs";
import { DeviceActionStatus, DeviceManagementKit } from "@ledgerhq/device-management-kit";
import { SignerHyperliquidBuilder } from "@ledgerhq/device-signer-kit-hyperliquid";
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import { DmkSignerHyperliquid, Action } from "../src/DmkSignerHyperliquid";

jest.mock("@ledgerhq/device-signer-kit-hyperliquid");

describe("DmkSignerHyperliquid", () => {
  const mockSignActions = jest.fn();
  const mockDmk = {} as DeviceManagementKit;
  const sessionId = "test-session-id";
  jest.mocked(SignerHyperliquidBuilder).mockImplementation(() => ({
    build: () => ({ signActions: mockSignActions }),
  }));
  const signer = new DmkSignerHyperliquid(mockDmk, sessionId);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("signActions", () => {
    const path = "44'/60'/0'/0/0";
    const certificate = new Uint8Array([1, 2, 3]);
    const signedMetadata = new Uint8Array([4, 5, 6]);
    const actions: Action[] = [{ type: "order", data: {} } as unknown as Action];

    it("should resolve with signatures when the device action completes", async () => {
      // GIVEN
      const expectedSignatures = [{ r: "0xabc", s: "0xdef", v: 27 }];
      mockSignActions.mockReturnValue({
        observable: of({ status: DeviceActionStatus.Completed, output: expectedSignatures }),
      });

      // WHEN
      const result = await signer.signActions(path, certificate, signedMetadata, actions);

      // THEN
      expect(result).toEqual(expectedSignatures);
    });

    it("should forward the correct parameters to the underlying signer", async () => {
      // GIVEN
      mockSignActions.mockReturnValue({
        observable: of({ status: DeviceActionStatus.Completed, output: [] }),
      });

      // WHEN
      await signer.signActions(path, certificate, signedMetadata, actions);

      // THEN
      expect(mockSignActions).toHaveBeenCalledWith({
        derivationPath: path,
        certificate,
        signedMetadata,
        actions,
      });
    });

    it("should reject with a generic Error when the device action fails", async () => {
      // GIVEN
      mockSignActions.mockReturnValue({
        observable: of({
          status: DeviceActionStatus.Error,
          error: { _tag: "SomeDAError", originalError: null },
        }),
      });

      // WHEN & THEN
      await expect(signer.signActions(path, certificate, signedMetadata, actions)).rejects.toThrow(
        "SomeDAError",
      );
    });

    it.each([
      {
        description: "errorCode 6985 → UserRefusedOnDevice",
        error: { _tag: "UserRefused", originalError: { errorCode: "6985" } },
        expectedError: UserRefusedOnDevice,
      },
      {
        description: "unknown errorCode → generic Error with _tag",
        error: { _tag: "UnknownError", originalError: { errorCode: "9999" } },
        expectedError: new Error("UnknownError"),
      },
    ])(
      "should reject with the correct error when the device action fails ($description)",
      async ({ error, expectedError }) => {
        // GIVEN
        mockSignActions.mockReturnValue({
          observable: of({
            status: DeviceActionStatus.Error,
            error,
          }),
        });

        // WHEN & THEN
        await expect(
          signer.signActions(path, certificate, signedMetadata, actions),
        ).rejects.toThrow(expectedError);
      },
    );

    it("should reject when the observable itself errors", async () => {
      // GIVEN
      const transportError = new Error("Transport failure");
      mockSignActions.mockReturnValue({
        observable: throwError(() => transportError),
      });

      // WHEN & THEN
      await expect(signer.signActions(path, certificate, signedMetadata, actions)).rejects.toThrow(
        "Transport failure",
      );
    });
  });
});
