import { TokenDataSource } from "../../token/data/TokenDataSource";
import { ExternalPluginDataSource } from "../data/ExternalPluginDataSource";
import { ExternalPluginContextLoader } from "./ExternalPluginContextLoader";
import { TransactionContext } from "../../shared/model/TransactionContext";
import { SelectorDetails } from "../model/SelectorDetails";
import { DappInfos } from "../model/DappInfos";
import { Interface } from "ethers/lib/utils";
import ABI from "../__tests__/abi.json";

const dappInfosBuilder = ({
  abi,
  selectorDetails,
}: {
  abi?: object[];
  selectorDetails?: Partial<SelectorDetails>;
}) => {
  return {
    abi: abi,
    selectorDetails: {
      erc20OfInterest: [],
      method: "",
      plugin: "",
      serializedData: "123456",
      signature: "7890",
      ...selectorDetails,
    },
  } as DappInfos;
};

const transactionBuilder = (
  abi: object,
  functionName: string,
  params: unknown[],
): TransactionContext => {
  const contract = new Interface(JSON.stringify(abi));
  const data = contract.encodeFunctionData(functionName, params);
  return {
    to: "0x0",
    data,
  } as TransactionContext;
};

describe("ExternalPluginContextLoader", () => {
  const mockTokenDataSource: TokenDataSource = { getTokenInfosPayload: jest.fn() };
  const mockExternalPluginDataSource: ExternalPluginDataSource = { getDappInfos: jest.fn() };
  const loader = new ExternalPluginContextLoader(mockExternalPluginDataSource, mockTokenDataSource);

  beforeEach(() => {
    jest.restoreAllMocks();
    jest
      .spyOn(mockTokenDataSource, "getTokenInfosPayload")
      .mockImplementation(({ address }) => Promise.resolve(`payload-${address}`));
  });

  describe("load function", () => {
    it("should return an empty array if no destination address is provided", async () => {
      // GIVEN
      const transaction = {} as TransactionContext;

      // WHEN
      const promise = () => loader.load(transaction);

      // THEN
      expect(promise()).resolves.toEqual([]);
    });

    it("should return an empty array if data is undefined", async () => {
      // GIVEN
      const transaction = { to: "0x0" } as TransactionContext;

      // WHEN
      const result = await loader.load(transaction);

      // THEN
      expect(result).toEqual([]);
    });

    it("should return an empty array if no data provided", async () => {
      // GIVEN
      const transaction = { to: "0x0", data: "0x" } as TransactionContext;

      // WHEN
      const result = await loader.load(transaction);

      // THEN
      expect(result).toEqual([]);
    });

    it("should return an empty array if no dapp info is povided", async () => {
      // GIVEN
      const transaction = transactionBuilder(ABI, "singleParam", [
        "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      ]);
      jest.spyOn(mockExternalPluginDataSource, "getDappInfos").mockResolvedValue(undefined);

      // WHEN
      const result = await loader.load(transaction);

      // THEN
      expect(result).toEqual([]);
    });

    it("should return an empty array if no erc20OfInterest is provided", async () => {
      // GIVEN
      const dappInfos = dappInfosBuilder({
        selectorDetails: { erc20OfInterest: [], method: "singleParam" },
      });
      const transaction = transactionBuilder(ABI, "singleParam", [
        "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      ]);
      jest.spyOn(mockExternalPluginDataSource, "getDappInfos").mockResolvedValue(dappInfos);

      // WHEN
      const result = await loader.load(transaction);

      // THEN
      expect(result).toEqual([]);
    });

    it("should return a list of context responses when one erc20OfInterest is provided for a single parameter", async () => {
      // GIVEN
      const dappInfos = dappInfosBuilder({
        abi: ABI,
        selectorDetails: { erc20OfInterest: ["fromToken"], method: "singleParam" },
      });
      const transaction = transactionBuilder(ABI, "singleParam", [
        "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      ]);
      jest.spyOn(mockExternalPluginDataSource, "getDappInfos").mockResolvedValue(dappInfos);

      // WHEN
      const result = await loader.load(transaction);

      // THEN
      expect(result).toEqual(
        expect.arrayContaining([
          {
            type: "setExternalPlugin",
            payload: "1234567890",
          },
          {
            type: "provideERC20TokenInformation",
            payload: "payload-0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          },
        ]),
      );
    });

    it("should return a context response with only set external plugin when one erc20OfInterest is provided for a single parameter but no payload is feched", async () => {
      // GIVEN
      const dappInfos = dappInfosBuilder({
        abi: ABI,
        selectorDetails: { erc20OfInterest: ["fromToken"], method: "singleParam" },
      });
      const transaction = transactionBuilder(ABI, "singleParam", [
        "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      ]);
      jest.spyOn(mockExternalPluginDataSource, "getDappInfos").mockResolvedValue(dappInfos);
      jest.spyOn(mockTokenDataSource, "getTokenInfosPayload").mockResolvedValue(undefined);

      // WHEN
      const result = await loader.load(transaction);

      // THEN
      expect(result).toEqual([
        {
          type: "error",
          error: new Error(
            "[ContextModule] ExternalPluginContextLoader: Unable to get payload for token 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          ),
        },
        {
          type: "setExternalPlugin",
          payload: "1234567890",
        },
      ]);
    });

    it("should return a list of context responses when two erc20OfInterest are provided for two parameters", async () => {
      // GIVEN
      const dappInfos = dappInfosBuilder({
        abi: ABI,
        selectorDetails: { erc20OfInterest: ["fromToken", "toToken"], method: "multipleParams" },
      });
      const transaction = transactionBuilder(ABI, "multipleParams", [
        "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      ]);
      jest.spyOn(mockExternalPluginDataSource, "getDappInfos").mockResolvedValue(dappInfos);

      // WHEN
      const result = await loader.load(transaction);

      // THEN
      expect(result).toEqual(
        expect.arrayContaining([
          {
            type: "setExternalPlugin",
            payload: "1234567890",
          },
          {
            type: "provideERC20TokenInformation",
            payload: "payload-0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          },
          {
            type: "provideERC20TokenInformation",
            payload: "payload-0xdAC17F958D2ee523a2206206994597C13D831ec7",
          },
        ]),
      );
    });

    it("should return a list of context responses when one erc20OfInterest is an array", async () => {
      // GIVEN
      const dappInfos = dappInfosBuilder({
        abi: ABI,
        selectorDetails: {
          erc20OfInterest: ["fromToken.0", "fromToken.1", "fromToken.2", "fromToken.-1"],
          method: "arrayParam",
        },
      });
      const transaction = transactionBuilder(ABI, "arrayParam", [
        [
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          "0xdAC17F958D2ee523a2206206994597C13D831ec7",
          "0xB8c77482e45F1F44dE1745F52C74426C631bDD52",
        ],
      ]);
      jest.spyOn(mockExternalPluginDataSource, "getDappInfos").mockResolvedValue(dappInfos);

      // WHEN
      const result = await loader.load(transaction);

      // THEN
      expect(result).toEqual([
        {
          type: "provideERC20TokenInformation",
          payload: "payload-0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        },
        {
          type: "provideERC20TokenInformation",
          payload: "payload-0xdAC17F958D2ee523a2206206994597C13D831ec7",
        },
        // fromToken.2
        {
          type: "provideERC20TokenInformation",
          payload: "payload-0xB8c77482e45F1F44dE1745F52C74426C631bDD52",
        },
        // fromToken.-1
        {
          type: "provideERC20TokenInformation",
          payload: "payload-0xB8c77482e45F1F44dE1745F52C74426C631bDD52",
        },
        {
          type: "setExternalPlugin",
          payload: "1234567890",
        },
      ]);
    });

    it("should throw an error when the abi is not conform", async () => {
      // GIVEN
      const dappInfos = dappInfosBuilder({
        abi: [{ fakeabi: "notworking" }],
        selectorDetails: {
          erc20OfInterest: ["fromToken"],
          method: "singleParam",
        },
      });
      const transaction = transactionBuilder(ABI, "singleParam", [
        "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      ]);
      jest.spyOn(mockExternalPluginDataSource, "getDappInfos").mockResolvedValue(dappInfos);

      // WHEN
      const promise = loader.load(transaction);

      // THEN
      expect(promise).rejects.toEqual(
        new Error("[ContextModule] ExternalPluginContextLoader: Unable to parse abi"),
      );
    });

    it("should throw an error when the erc20OfInterest doest not exist in the transaction", async () => {
      // GIVEN
      const dappInfos = dappInfosBuilder({
        abi: ABI,
        selectorDetails: {
          erc20OfInterest: ["notFound"],
          method: "singleParam",
        },
      });
      const transaction = transactionBuilder(ABI, "singleParam", [
        "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      ]);
      jest.spyOn(mockExternalPluginDataSource, "getDappInfos").mockResolvedValue(dappInfos);

      // WHEN
      const promise = loader.load(transaction);

      // THEN
      expect(promise).rejects.toEqual(
        new Error("[ContextModule] ExternalPluginContextLoader: Unable to get address"),
      );
    });

    it("should throw an error when an out-of-bounds element is present in erc20OfInterest", async () => {
      // GIVEN
      const dappInfos = dappInfosBuilder({
        abi: ABI,
        selectorDetails: {
          erc20OfInterest: ["fromToken.3"],
          method: "arrayParam",
        },
      });
      const transaction = transactionBuilder(ABI, "arrayParam", [
        [
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          "0xdAC17F958D2ee523a2206206994597C13D831ec7",
          "0xB8c77482e45F1F44dE1745F52C74426C631bDD52",
        ],
      ]);
      jest.spyOn(mockExternalPluginDataSource, "getDappInfos").mockResolvedValue(dappInfos);

      // WHEN
      const promise = loader.load(transaction);

      // THEN
      expect(promise).rejects.toEqual(
        new Error("[ContextModule] ExternalPluginContextLoader: Unable to get address"),
      );
    });

    it("should return a list of context responses when one erc20OfInterest is a complex struct", async () => {
      // GIVEN
      const dappInfos = dappInfosBuilder({
        abi: ABI,
        selectorDetails: {
          erc20OfInterest: [
            "complexStruct.address1",
            "complexStruct.param1.param2.0.param3.addresses.0",
            "complexStruct.param1.param2.0.param3.addresses.1",
            "complexStruct.param1.param2.0.param3.addresses.-1",
            "complexStruct.param1.param2.1.param3.addresses.0",
            "complexStruct.param1.param2.-1.param3.addresses.0",
          ],
          method: "complexStructParam",
        },
      });
      const transaction = transactionBuilder(ABI, "complexStructParam", [
        {
          address1: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          param1: {
            param2: [
              {
                param3: {
                  addresses: [
                    "0xdAC17F958D2ee523a2206206994597C13D831ec7",
                    "0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE",
                  ],
                },
              },
              { param3: { addresses: ["0xB8c77482e45F1F44dE1745F52C74426C631bDD52"] } },
            ],
          },
        },
      ]);
      jest.spyOn(mockExternalPluginDataSource, "getDappInfos").mockResolvedValue(dappInfos);

      // WHEN
      const result = await loader.load(transaction);

      // THEN
      expect(result).toEqual([
        {
          type: "provideERC20TokenInformation",
          payload: "payload-0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        },
        {
          type: "provideERC20TokenInformation",
          payload: "payload-0xdAC17F958D2ee523a2206206994597C13D831ec7",
        },
        {
          type: "provideERC20TokenInformation",
          payload: "payload-0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE",
        },
        {
          type: "provideERC20TokenInformation",
          payload: "payload-0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE",
        },
        {
          type: "provideERC20TokenInformation",
          payload: "payload-0xB8c77482e45F1F44dE1745F52C74426C631bDD52",
        },
        {
          type: "provideERC20TokenInformation",
          payload: "payload-0xB8c77482e45F1F44dE1745F52C74426C631bDD52",
        },
        {
          type: "setExternalPlugin",
          payload: "1234567890",
        },
      ]);
    });
  });
});
