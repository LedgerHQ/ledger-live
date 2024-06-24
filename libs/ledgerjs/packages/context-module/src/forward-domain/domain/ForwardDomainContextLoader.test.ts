import { TransactionContext } from "../../shared/model/TransactionContext";
import { ForwardDomainDataSource } from "../data/ForwardDomainDataSource";
import { ForwardDomainContextLoader } from "./ForwardDomainContextLoader";

describe("ForwardDomainContextLoader", () => {
  const transaction = {} as TransactionContext;
  const mockForwardDomainDataSource: ForwardDomainDataSource = { getDomainNamePayload: jest.fn() };

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.spyOn(mockForwardDomainDataSource, "getDomainNamePayload").mockResolvedValue("payload");
  });

  describe("load function", () => {
    it("should return an empty array when no domain or registry", async () => {
      const loader = new ForwardDomainContextLoader(mockForwardDomainDataSource);
      const promise = () => loader.load(transaction);

      expect(promise()).resolves.toEqual([]);
    });

    it("should return an error when domain > max length", async () => {
      const transaction = {
        domain: "maxlength-maxlength-maxlength-maxlength-maxlength-maxlength",
      } as TransactionContext;

      const loader = new ForwardDomainContextLoader(mockForwardDomainDataSource);
      const result = await loader.load(transaction);

      expect(result).toEqual([
        {
          type: "error" as const,
          error: new Error("[ContextModule] ForwardDomainLoader: invalid domain"),
        },
      ]);
    });

    it("should return an error when domain is not valid", async () => {
      const transaction = {
        domain: "hello👋",
      } as TransactionContext;

      const loader = new ForwardDomainContextLoader(mockForwardDomainDataSource);
      const result = await loader.load(transaction);

      expect(result).toEqual([
        {
          type: "error" as const,
          error: new Error("[ContextModule] ForwardDomainLoader: invalid domain"),
        },
      ]);
    });

    it("should return a payload", async () => {
      const transaction = {
        domain: "hello.eth",
        challenge: "challenge",
      } as TransactionContext;

      const loader = new ForwardDomainContextLoader(mockForwardDomainDataSource);
      const result = await loader.load(transaction);

      expect(result).toEqual([
        {
          type: "provideDomainName" as const,
          payload: "payload",
        },
      ]);
    });

    it("should return an error when no payload", async () => {
      const transaction = {
        domain: "hello.eth",
        challenge: "challenge",
      } as TransactionContext;
      jest.spyOn(mockForwardDomainDataSource, "getDomainNamePayload").mockResolvedValue(undefined);

      const loader = new ForwardDomainContextLoader(mockForwardDomainDataSource);
      const result = await loader.load(transaction);

      expect(result).toEqual([
        {
          type: "error" as const,
          error: new Error("[ContextModule] ForwardDomainLoader: error getting domain payload"),
        },
      ]);
    });
  });
});
