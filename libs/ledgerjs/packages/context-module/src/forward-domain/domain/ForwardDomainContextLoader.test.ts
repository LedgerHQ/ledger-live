import { LoaderOptions } from "../../shared/model/LoaderOptions";
import { Transaction } from "../../shared/model/Transaction";
import { ForwardDomainContextLoader } from "./ForwardDomainContextLoader";

describe("ForwardDomainContextLoader", () => {
  const transaction = {} as Transaction;

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  describe("load function", () => {
    it("should return an empty array when no domain or registry", async () => {
      const options = {} as LoaderOptions;

      const loader = new ForwardDomainContextLoader({ getDomainNamePayload: jest.fn() });
      const promise = () => loader.load(transaction, options);

      expect(promise()).resolves.toEqual([]);
    });

    it("should throw an error when no registry", async () => {
      const options = { options: { forwardDomain: { domain: "test.eth" } } } as LoaderOptions;

      const loader = new ForwardDomainContextLoader({ getDomainNamePayload: jest.fn() });
      const promise = () => loader.load(transaction, options);

      expect(promise()).rejects.toThrow(
        new Error(
          "[ContextModule] ForwardDomainLoader: Invalid combination of domain and registry. Either both domain and registry should exist",
        ),
      );
    });

    it("should throw an error when no domain", async () => {
      const options = { options: { forwardDomain: { registry: "ens" } } } as LoaderOptions;

      const loader = new ForwardDomainContextLoader({ getDomainNamePayload: jest.fn() });
      const promise = () => loader.load(transaction, options);

      expect(promise()).rejects.toThrow(
        new Error(
          "[ContextModule] ForwardDomainLoader: Invalid combination of domain and registry. Either both domain and registry should exist",
        ),
      );
    });

    it("should return an error when domain > max length", async () => {
      const options = {
        options: {
          forwardDomain: {
            domain: "maxlength-maxlength-maxlength-maxlength-maxlength",
            registry: "ens",
          },
        },
      } as LoaderOptions;

      const loader = new ForwardDomainContextLoader({ getDomainNamePayload: jest.fn() });
      const result = await loader.load(transaction, options);

      expect(result).toEqual([
        {
          type: "error" as const,
          error: new Error("[ContextModule] ForwardDomainLoader: invalid domain"),
        },
      ]);
    });

    it("should return an error when domain is not valid", async () => {
      const options = {
        options: { forwardDomain: { domain: "hello👋", registry: "ens" } },
      } as LoaderOptions;

      const loader = new ForwardDomainContextLoader({ getDomainNamePayload: jest.fn() });
      const result = await loader.load(transaction, options);

      expect(result).toEqual([
        {
          type: "error" as const,
          error: new Error("[ContextModule] ForwardDomainLoader: invalid domain"),
        },
      ]);
    });

    it("should return a payload", async () => {
      const options = {
        options: { forwardDomain: { domain: "hello.eth", registry: "ens" } },
      } as LoaderOptions;

      const loader = new ForwardDomainContextLoader({
        getDomainNamePayload: () => Promise.resolve("payload"),
      });
      const result = await loader.load(transaction, options);

      expect(result).toEqual([
        {
          type: "provideDomainName" as const,
          payload: "payload",
        },
      ]);
    });
  });
});
