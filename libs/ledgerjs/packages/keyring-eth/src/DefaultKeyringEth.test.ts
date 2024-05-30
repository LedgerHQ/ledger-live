import AppBinding from "@ledgerhq/hw-app-eth";
import { DefaultKeyringEth } from "./DefaultKeyringEth";
import { Transaction } from "ethers";
import { KeyringEth } from "./KeyringEth";
import { ContextModule } from "@ledgerhq/context-module/lib/ContextModule";
import { ContextResponse } from "@ledgerhq/context-module";

describe("DefaultKeyringEth", () => {
  let keyring: KeyringEth;

  const mockAppBinding = {
    provideDomainName: jest.fn(),
    provideERC20TokenInformation: jest.fn(),
    provideNFTInformation: jest.fn(),
    setExternalPlugin: jest.fn(),
    setPlugin: jest.fn(),
    getChallenge: jest.fn(),
    signTransaction: jest.fn(),
  } as unknown as AppBinding;
  const mockContextModule = {
    getContexts: jest.fn(),
  } as ContextModule;

  beforeEach(() => {
    jest.clearAllMocks();
    keyring = new DefaultKeyringEth(mockAppBinding, mockContextModule);
    jest.spyOn(mockAppBinding, "signTransaction").mockResolvedValue({ r: "", s: "", v: "42" });
  });

  describe("signTransaction calls", () => {
    it("should call app binding provide with one context provided", async () => {
      // GIVEN
      const payload = "payload";
      const contexts: ContextResponse[] = [{ type: "provideDomainName", payload }];
      jest.spyOn(mockContextModule, "getContexts").mockResolvedValue(contexts);

      // WHEN
      await keyring.signTransaction("", {} as Transaction, {});

      // THEN
      expect(mockAppBinding.provideDomainName).toHaveBeenCalledWith(payload);
      expect(mockAppBinding.provideERC20TokenInformation).not.toHaveBeenCalled();
      expect(mockAppBinding.provideNFTInformation).not.toHaveBeenCalled();
      expect(mockAppBinding.setExternalPlugin).not.toHaveBeenCalled();
      expect(mockAppBinding.setPlugin).not.toHaveBeenCalled();
    });

    it("should call multiple app binding provide", async () => {
      // GIVEN
      const payloads = ["payload1", "payload2"];
      const contexts: ContextResponse[] = [
        { type: "provideERC20TokenInformation", payload: payloads[0] },
        { type: "provideNFTInformation", payload: payloads[1] },
      ];
      jest.spyOn(mockContextModule, "getContexts").mockResolvedValue(contexts);

      // WHEN
      await keyring.signTransaction("", {} as Transaction, {});

      // THEN
      expect(mockAppBinding.provideDomainName).not.toHaveBeenCalled();
      expect(mockAppBinding.provideERC20TokenInformation).toHaveBeenCalledWith(payloads[0]);
      expect(mockAppBinding.provideNFTInformation).toHaveBeenCalledWith(payloads[1]);
      expect(mockAppBinding.setExternalPlugin).not.toHaveBeenCalled();
      expect(mockAppBinding.setPlugin).not.toHaveBeenCalled();
    });

    it("should call the same multiple app binding provide multiple times", async () => {
      // GIVEN
      const payloads = ["payload1", "payload2", "payload3"];
      const contexts: ContextResponse[] = [
        { type: "provideERC20TokenInformation", payload: payloads[0] },
        { type: "provideERC20TokenInformation", payload: payloads[1] },
        { type: "provideERC20TokenInformation", payload: payloads[2] },
      ];
      jest.spyOn(mockContextModule, "getContexts").mockResolvedValue(contexts);

      // WHEN
      await keyring.signTransaction("", {} as Transaction, {});

      // THEN
      expect(mockAppBinding.provideDomainName).not.toHaveBeenCalled();
      expect(mockAppBinding.provideERC20TokenInformation).toHaveBeenCalledWith(payloads[0]);
      expect(mockAppBinding.provideERC20TokenInformation).toHaveBeenCalledWith(payloads[1]);
      expect(mockAppBinding.provideERC20TokenInformation).toHaveBeenCalledWith(payloads[2]);
      expect(mockAppBinding.provideNFTInformation).not.toHaveBeenCalled();
      expect(mockAppBinding.setExternalPlugin).not.toHaveBeenCalled();
      expect(mockAppBinding.setPlugin).not.toHaveBeenCalled();
    });

    it("should call all app binding provide", async () => {
      // GIVEN
      const payloads = ["payload1", "payload2", "payload3", "payload4", "payload5"];
      const contexts: ContextResponse[] = [
        { type: "provideDomainName", payload: payloads[0] },
        { type: "provideERC20TokenInformation", payload: payloads[1] },
        { type: "provideNFTInformation", payload: payloads[2] },
        { type: "setExternalPlugin", payload: payloads[3] },
        { type: "setPlugin", payload: payloads[4] },
      ];
      jest.spyOn(mockContextModule, "getContexts").mockResolvedValue(contexts);

      // WHEN
      await keyring.signTransaction("", {} as Transaction, {});

      // THEN
      expect(mockAppBinding.provideDomainName).toHaveBeenCalledWith(payloads[0]);
      expect(mockAppBinding.provideERC20TokenInformation).toHaveBeenCalledWith(payloads[1]);
      expect(mockAppBinding.provideNFTInformation).toHaveBeenCalledWith(payloads[2]);
      expect(mockAppBinding.setExternalPlugin).toHaveBeenCalledWith(payloads[3]);
      expect(mockAppBinding.setPlugin).toHaveBeenCalledWith(payloads[4]);
    });

    it("should handle error context", async () => {
      // GIVEN
      const contexts: ContextResponse[] = [{ type: "error", error: new Error() }];
      jest.spyOn(mockContextModule, "getContexts").mockResolvedValue(contexts);

      // WHEN
      const response = await keyring.signTransaction("", {} as Transaction, {});

      // THEN
      expect(response).toEqual({ r: "0x", s: "0x", v: 66 });
    });

    it("should provide a challenge to the context module", async () => {
      // GIVEN
      const challenge = "challenge";
      const contexts: ContextResponse[] = [{ type: "provideDomainName", payload: "payload" }];
      jest.spyOn(mockContextModule, "getContexts").mockResolvedValue(contexts);
      jest.spyOn(mockAppBinding, "getChallenge").mockResolvedValue(challenge);

      // WHEN
      await keyring.signTransaction("", {} as Transaction, {});

      // THEN
      expect(mockContextModule.getContexts).toHaveBeenCalledWith(expect.any(Object), {
        challenge,
        options: {},
      });
    });

    it("should call app binding signTransaction", async () => {
      // GIVEN
      const transaction = {} as Transaction;
      const derivationPath = "derivationPath";

      // WHEN
      await keyring.signTransaction(derivationPath, transaction, {});

      // THEN
      expect(mockAppBinding.signTransaction).toHaveBeenCalledWith(
        derivationPath,
        "c6808080808080",
        null,
      );
    });
  });
});
