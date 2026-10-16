import { PortfolioApiError } from "@ledgerhq/portfolio-module-framework";
import { portfolioEndpoints } from "./portfolios";
import { aLocalNetwork, someDeps } from "./test-utils";

const ethereum = aLocalNetwork({
  currencyId: "ethereum",
  derivationMode: "",
  derivationPath: "44'/60'/0'",
  registrationTypes: ["static", "evm"],
});

const setUp = async () => {
  const deps = someDeps({ networks: { bitcoin: aLocalNetwork(), ethereum } });
  const endpoints = portfolioEndpoints(deps);
  await endpoints.createPortfolio("portfolio");
  return { ...endpoints, store: deps.store };
};

const notFound = (message: string) => new PortfolioApiError("NOT_FOUND", message);

describe("portfolioEndpoints", () => {
  describe("createPortfolio", () => {
    it("creates an empty portfolio", async () => {
      const { createPortfolio, getPortfolio } = portfolioEndpoints(someDeps());

      const created = await createPortfolio("portfolio");

      expect(created).toEqual({ id: "portfolio", registrations: [], accounts: [] });
      expect(await getPortfolio("portfolio")).toEqual(created);
    });

    it("returns the existing portfolio when it already exists", async () => {
      const { createPortfolio, addRegistrations } = await setUp();
      const registered = await addRegistrations("portfolio", [
        { type: "auto_derive", network: "bitcoin", xpub: "xpub" },
      ]);

      expect(await createPortfolio("portfolio")).toEqual(registered);
    });
  });

  describe("getPortfolio", () => {
    it("rejects an unknown portfolio as not found", async () => {
      await expect(portfolioEndpoints(someDeps()).getPortfolio("unknown")).rejects.toThrow(
        notFound("Portfolio unknown not found"),
      );
    });
  });

  describe("addRegistrations", () => {
    it("adds the registrations and their accounts, uninitialized", async () => {
      const { addRegistrations, store } = await setUp();

      const portfolio = await addRegistrations("portfolio", [
        { type: "auto_derive", network: "bitcoin", xpub: "xpub" },
        { type: "cardano", accountId: "ada", network: "cardano" },
      ]);

      expect(portfolio).toEqual({
        id: "portfolio",
        registrations: [
          { type: "auto_derive", id: "id-1", network: "bitcoin", xpub: "xpub" },
          { type: "cardano", id: "id-2", network: "cardano" },
        ],
        accounts: [
          { id: "js:2:bitcoin:xpub:native_segwit", network: "bitcoin", status: "uninitialized" },
          {
            id: "ada",
            network: "cardano",
            status: "registration_failure",
            error: {
              name: "Error",
              message: "cardano registrations are not served locally on cardano",
            },
          },
        ],
      });
      expect((await store.get("portfolio"))?.accounts[0]?.descriptor?.key).toBe("xpub");
    });

    it("registers a static account's address with its network's indexer once stored", async () => {
      const network = aLocalNetwork({ currencyId: "ethereum", registrationTypes: ["static"] });
      network.coinModule.supports = jest.fn(() => true);
      const deps = someDeps({ networks: { ethereum: network } });
      const { createPortfolio, addRegistrations } = portfolioEndpoints(deps);
      const { store } = deps;
      await createPortfolio("portfolio");
      const stored = jest.fn();
      network.coinModule.register.mockImplementation(async () => {
        stored(await store.get("portfolio"));
        return { type: "a4", accountId: "a4-account" };
      });
      const input = {
        type: "static" as const,
        accountId: "my-account",
        network: "ethereum",
        addresses: ["0xa"],
      };

      await addRegistrations("portfolio", [input]);
      await addRegistrations("portfolio", [input]);
      await new Promise(resolve => setImmediate(resolve));

      expect(network.coinModule.register).toHaveBeenCalledTimes(2);
      expect(network.coinModule.register).toHaveBeenCalledWith(network.context, "0xa");
      expect(stored).toHaveBeenCalledWith(
        expect.objectContaining({ accounts: [expect.objectContaining({ id: "my-account" })] }),
      );
    });

    it("keeps a single account when the same account is registered twice", async () => {
      const { addRegistrations } = await setUp();
      const xpub = { type: "auto_derive" as const, network: "bitcoin", xpub: "xpub" };

      await addRegistrations("portfolio", [xpub]);
      const portfolio = await addRegistrations("portfolio", [xpub, xpub]);

      expect(portfolio.registrations).toHaveLength(3);
      expect(portfolio.accounts).toEqual([
        { id: "js:2:bitcoin:xpub:native_segwit", network: "bitcoin", status: "uninitialized" },
      ]);
    });

    it("rejects an unknown portfolio as not found", async () => {
      const { addRegistrations } = portfolioEndpoints(someDeps());

      await expect(addRegistrations("unknown", [])).rejects.toThrow(
        notFound("Portfolio unknown not found"),
      );
    });
  });

  describe("removeRegistrations", () => {
    it("removes the registrations and their accounts", async () => {
      const { addRegistrations, removeRegistrations } = await setUp();
      await addRegistrations("portfolio", [
        { type: "auto_derive", network: "bitcoin", xpub: "xpub" },
        { type: "evm", address: "0xabc" },
      ]);

      const portfolio = await removeRegistrations("portfolio", ["id-1", "unknown"]);

      expect(portfolio).toEqual({
        id: "portfolio",
        registrations: [{ type: "evm", id: "id-2", address: "0xabc" }],
        accounts: [{ id: "js:2:ethereum:0xabc:", network: "ethereum", status: "uninitialized" }],
      });
    });
  });

  describe("addAddresses", () => {
    it("rejects any account as a bad request: its account module manages its addresses", async () => {
      const { addAddresses, addRegistrations } = await setUp();
      await addRegistrations("portfolio", [
        { type: "static", accountId: "my-account", network: "ethereum", addresses: ["0xa"] },
      ]);

      await expect(
        addAddresses("portfolio", "my-account", { type: "static", addresses: ["0xb"] }),
      ).rejects.toThrow(
        new PortfolioApiError(
          "BAD_REQUEST",
          "The addresses of local account my-account are managed by its account module",
        ),
      );
    });

    it("rejects an unknown account, or portfolio, as not found", async () => {
      const { addAddresses } = await setUp();

      await expect(addAddresses("portfolio", "unknown", { type: "static" })).rejects.toThrow(
        notFound("Account unknown not found"),
      );
      await expect(addAddresses("unknown", "unknown", { type: "static" })).rejects.toThrow(
        notFound("Portfolio unknown not found"),
      );
    });
  });
});
