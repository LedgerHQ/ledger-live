import { createA4CoinModuleApi } from "./index";
import { A4Client, A4HttpError } from "./client";

jest.mock("./client", () => {
  const actual = jest.requireActual("./client");
  return { ...actual, A4Client: jest.fn() };
});

const ADDRESS = "0xabc";
const OPTS = { endpoint: "https://a4.test" };

type ClientMock = {
  getAccount: jest.Mock;
  createAccount: jest.Mock;
  addAddresses: jest.Mock;
  getBalances: jest.Mock;
  listOperations: jest.Mock;
};

function mockClient(overrides: Partial<ClientMock> = {}): ClientMock {
  const client: ClientMock = {
    getAccount: jest
      .fn()
      .mockResolvedValue({ data: { syncStatus: "Synchronized" } }),
    createAccount: jest.fn().mockResolvedValue({ data: {} }),
    addAddresses: jest.fn().mockResolvedValue({ data: { version: "v1" } }),
    getBalances: jest.fn().mockResolvedValue({
      data: { assets: { native: { type: "int", value: "100" } } },
    }),
    listOperations: jest
      .fn()
      .mockResolvedValue({ data: { items: [], next: null } }),
    ...overrides,
  };
  (A4Client as jest.Mock).mockImplementation(() => client);
  return client;
}

function makeDelegate() {
  return {
    getBalance: jest
      .fn()
      .mockResolvedValue([{ value: 999n, asset: { type: "native" } }]),
    listOperations: jest
      .fn()
      .mockResolvedValue({ items: [{ id: "delegate-op" }], next: undefined }),
    lastBlock: jest.fn(),
    stakingSupported: false,
  } as any;
}

describe("createA4CoinModuleApi", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("read mode", () => {
    it("serves balances optimistically without pre-registering", async () => {
      const client = mockClient();
      const delegate = makeDelegate();
      const api = createA4CoinModuleApi("ethereum", delegate, {
        read: true,
        ...OPTS,
      });

      const balances = await api.getBalance(ADDRESS);

      expect(client.getBalances).toHaveBeenCalledTimes(1);
      expect(client.createAccount).not.toHaveBeenCalled(); // no registration when A4 answers
      expect(balances).toEqual([{ value: 100n, asset: { type: "native" } }]);
      expect(delegate.getBalance).not.toHaveBeenCalled();
    });

    it("sends the computed account version as If-Account-Version", async () => {
      const client = mockClient();
      const api = createA4CoinModuleApi("ethereum", makeDelegate(), {
        read: true,
        ...OPTS,
      });

      await api.getBalance(ADDRESS);

      expect(client.getBalances).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringMatching(/^[0-9a-f]{64}$/),
      );
    });

    it("serves operations from A4 and exposes the cursor", async () => {
      mockClient({
        listOperations: jest.fn().mockResolvedValue({
          data: {
            items: [
              {
                txId: "0xh",
                block: { hash: "0xb", height: 1, time: "2024-01-01T00:00:00Z" },
                asset: "native",
                amount: "5",
                type: "receive",
              },
            ],
            next: { cursor: "next-page" },
          },
        }),
      });
      const api = createA4CoinModuleApi("ethereum", makeDelegate(), {
        read: true,
        ...OPTS,
      });

      const page = await api.listOperations(ADDRESS, { minHeight: 0 });

      expect(page.next).toBe("next-page");
      expect(page.items[0].type).toBe("IN");
    });

    it("registers and retries with the server version when the account does not exist (404)", async () => {
      const client = mockClient({
        addAddresses: jest
          .fn()
          .mockResolvedValue({ data: { version: "srv-404" }, version: "srv-404" }),
        getBalances: jest
          .fn()
          .mockRejectedValueOnce(new A4HttpError(404, "not found"))
          .mockResolvedValueOnce({
            data: { assets: { native: { type: "int", value: "7" } } },
          }),
      });
      const api = createA4CoinModuleApi("ethereum", makeDelegate(), {
        read: true,
        ...OPTS,
      });

      const balances = await api.getBalance(ADDRESS);

      expect(client.createAccount).toHaveBeenCalledTimes(1);
      expect(client.addAddresses).toHaveBeenCalledWith(expect.any(String), [
        ADDRESS,
      ]);
      // The retry must use the version the server returned, not the locally computed one.
      expect(client.getBalances).toHaveBeenLastCalledWith(
        expect.any(String),
        "srv-404",
      );
      expect(balances).toEqual([{ value: 7n, asset: { type: "native" } }]);
    });

    it("re-adds addresses and retries with the server version on a version mismatch (412)", async () => {
      const client = mockClient({
        addAddresses: jest
          .fn()
          .mockResolvedValue({ data: { version: "srv-412" }, version: "srv-412" }),
        getBalances: jest
          .fn()
          .mockRejectedValueOnce(new A4HttpError(412, "mismatch"))
          .mockResolvedValueOnce({
            data: { assets: { native: { type: "int", value: "8" } } },
          }),
      });
      const api = createA4CoinModuleApi("ethereum", makeDelegate(), {
        read: true,
        ...OPTS,
      });

      const balances = await api.getBalance(ADDRESS);

      expect(client.createAccount).not.toHaveBeenCalled();
      expect(client.addAddresses).toHaveBeenCalledTimes(1);
      // The retry must send the server's authoritative version so it stops looping on 412.
      expect(client.getBalances).toHaveBeenLastCalledWith(
        expect.any(String),
        "srv-412",
      );
      expect(balances).toEqual([{ value: 8n, asset: { type: "native" } }]);
    });

    it("registers the EVM address normalized (lowercased), matching the account id derivation", async () => {
      const checksummed = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";
      const client = mockClient({
        getBalances: jest
          .fn()
          .mockRejectedValueOnce(new A4HttpError(404, "not found"))
          .mockResolvedValueOnce({
            data: { assets: { native: { type: "int", value: "1" } } },
          }),
      });
      const api = createA4CoinModuleApi("ethereum", makeDelegate(), {
        read: true,
        ...OPTS,
      });

      await api.getBalance(checksummed);

      // We register the canonical (lowercased) address so the server stores — and hashes its
      // version from — the same string the client computes the version from.
      expect(client.addAddresses).toHaveBeenCalledWith(expect.any(String), [
        checksummed.toLowerCase(),
      ]);
    });

    it("falls back to the locally computed version when the server returns none on retry", async () => {
      const client = mockClient({
        addAddresses: jest.fn().mockResolvedValue({ data: {} }),
        getBalances: jest
          .fn()
          .mockRejectedValueOnce(new A4HttpError(412, "mismatch"))
          .mockResolvedValueOnce({
            data: { assets: { native: { type: "int", value: "9" } } },
          }),
      });
      const api = createA4CoinModuleApi("ethereum", makeDelegate(), {
        read: true,
        ...OPTS,
      });

      const balances = await api.getBalance(ADDRESS);

      expect(client.getBalances).toHaveBeenLastCalledWith(
        expect.any(String),
        expect.stringMatching(/^[0-9a-f]{64}$/),
      );
      expect(balances).toEqual([{ value: 9n, asset: { type: "native" } }]);
    });

    it("falls back to the delegate on a 5xx (no registration attempt)", async () => {
      const delegate = makeDelegate();
      const client = mockClient({
        getBalances: jest.fn().mockRejectedValue(new A4HttpError(503, "boom")),
      });
      const api = createA4CoinModuleApi("ethereum", delegate, {
        read: true,
        ...OPTS,
      });

      const balances = await api.getBalance(ADDRESS);

      expect(client.createAccount).not.toHaveBeenCalled();
      expect(client.addAddresses).not.toHaveBeenCalled();
      expect(delegate.getBalance).toHaveBeenCalledWith(ADDRESS, undefined);
      expect(balances).toEqual([{ value: 999n, asset: { type: "native" } }]);
    });

    it("falls back to the delegate when the account is not yet indexed (422)", async () => {
      const delegate = makeDelegate();
      mockClient({
        getBalances: jest
          .fn()
          .mockRejectedValue(new A4HttpError(422, "uninitialized")),
      });
      const api = createA4CoinModuleApi("ethereum", delegate, {
        read: true,
        ...OPTS,
      });

      await api.getBalance(ADDRESS);

      expect(delegate.getBalance).toHaveBeenCalled();
    });

    it("keeps staking balances from the delegate when staking is supported", async () => {
      const delegate = makeDelegate();
      delegate.stakingSupported = true;
      delegate.getBalance.mockResolvedValue([
        { value: 50n, asset: { type: "native" }, stake: { uid: "s1" } },
        { value: 1n, asset: { type: "native" } }, // non-stake entry must be ignored
      ]);
      mockClient();
      const api = createA4CoinModuleApi("ethereum", delegate, {
        read: true,
        ...OPTS,
      });

      const balances = await api.getBalance(ADDRESS);

      expect(balances).toEqual([
        { value: 100n, asset: { type: "native" } },
        { value: 50n, asset: { type: "native" }, stake: { uid: "s1" } },
      ]);
    });
  });

  describe("register-only mode", () => {
    it("polls A4 and reads from the delegate when the account already exists", async () => {
      const client = mockClient();
      const delegate = makeDelegate();
      const api = createA4CoinModuleApi("ethereum", delegate, {
        read: false,
        ...OPTS,
      });

      const balances = await api.getBalance(ADDRESS);

      expect(client.getAccount).toHaveBeenCalledTimes(1);
      expect(client.createAccount).not.toHaveBeenCalled();
      expect(delegate.getBalance).toHaveBeenCalled();
      expect(balances).toEqual([{ value: 999n, asset: { type: "native" } }]);
    });

    it("registers when the poll reports the account is missing (404)", async () => {
      const client = mockClient({
        getAccount: jest
          .fn()
          .mockRejectedValue(new A4HttpError(404, "not found")),
      });
      const api = createA4CoinModuleApi("ethereum", makeDelegate(), {
        read: false,
        ...OPTS,
      });

      await api.getBalance(ADDRESS);

      expect(client.createAccount).toHaveBeenCalledTimes(1);
      expect(client.addAddresses).toHaveBeenCalledWith(expect.any(String), [
        ADDRESS,
      ]);
    });

    it("swallows any A4 failure and still reads from the delegate", async () => {
      const delegate = makeDelegate();
      mockClient({
        getAccount: jest.fn().mockRejectedValue(new A4HttpError(500, "down")),
        createAccount: jest
          .fn()
          .mockRejectedValue(new A4HttpError(500, "down")),
      });
      const api = createA4CoinModuleApi("ethereum", delegate, {
        read: false,
        ...OPTS,
      });

      await expect(api.getBalance(ADDRESS)).resolves.toEqual([
        { value: 999n, asset: { type: "native" } },
      ]);
      expect(delegate.getBalance).toHaveBeenCalled();
    });
  });
});
