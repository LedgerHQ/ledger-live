/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { ExternalNodeConfig } from "../../config";
import * as withApiModule from "../withApi";
import { createNodeApi } from "./rpc.common";

jest.mock("../withApi");
const withApiSpy = jest.spyOn(withApiModule, "withApi");

describe("rpc.common", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("makeGetTokenBalance", () => {
    const currency = {} as unknown as CryptoCurrency;
    const nodeConfig = {} as unknown as ExternalNodeConfig;
    const nodeApi = createNodeApi(nodeConfig);

    it("should use ethers-http-only as retry policy", async () => {
      await nodeApi.getTokenBalance(
        currency,
        "some random ethereum address",
        "some random ethereum contract address",
      );
      expect(withApiSpy).toHaveBeenCalledWith(
        currency,
        expect.any(Function),
        nodeConfig,
        "ethers-http-only",
      );
    });
  });
});
