import network from "@ledgerhq/live-network";
import { A4Client } from "./index";

jest.mock("@ledgerhq/live-network");
jest.mock("@ledgerhq/logs");

const mockNetwork = jest.mocked(network);

describe("A4Client", () => {
  let client: A4Client;

  beforeEach(() => {
    client = new A4Client("https://a4.example.com", "ethereum");
    mockNetwork.mockReset();
  });

  describe("getAccount", () => {
    it("returns account data and version header", async () => {
      mockNetwork.mockResolvedValueOnce({
        data: {
          id: "account-1",
          createdAt: "2024-01-01T00:00:00Z",
          version: "bd348b6a640c2c766f6e03ecda7a772e9220c53495e61d962ece79ee306e914c",
          status: "Synchronized",
        },
        status: 200,
        headers: {
          "a4-account-version": "bd348b6a640c2c766f6e03ecda7a772e9220c53495e61d962ece79ee306e914c",
        },
      });

      const result = await client.getAccount("account-1");

      expect(result).toEqual({
        data: {
          id: "account-1",
          createdAt: "2024-01-01T00:00:00Z",
          version: "bd348b6a640c2c766f6e03ecda7a772e9220c53495e61d962ece79ee306e914c",
          status: "Synchronized",
        },
        version: "bd348b6a640c2c766f6e03ecda7a772e9220c53495e61d962ece79ee306e914c",
      });
      expect(mockNetwork).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "GET",
          url: "https://a4.example.com/ethereum/v2/account/account-1",
        }),
      );
    });

    it("sends A4-If-Account-Version header when ifVersion is provided", async () => {
      mockNetwork.mockResolvedValueOnce({ data: {}, status: 200, headers: {} });

      await client.getAccount(
        "account-1",
        "bd348b6a640c2c766f6e03ecda7a772e9220c53495e61d962ece79ee306e914c",
      );

      expect(mockNetwork).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: {
            "A4-If-Account-Version":
              "bd348b6a640c2c766f6e03ecda7a772e9220c53495e61d962ece79ee306e914c",
          },
        }),
      );
    });

    it("throws A4HttpError with status 404 and message when account not found", async () => {
      const err = Object.assign(new Error("account not found"), {
        name: "LedgerAPI4xx",
        status: 404,
      });
      mockNetwork.mockRejectedValueOnce(err);

      await expect(client.getAccount("account-1")).rejects.toEqual(
        expect.objectContaining({ name: "A4HttpError", status: 404, message: "account not found" }),
      );
    });
  });

  describe("createAccount", () => {
    it("throws A4HttpError with status 500 and message on server error", async () => {
      const err = Object.assign(new Error("internal server error"), {
        name: "LedgerAPI5xx",
        status: 500,
      });
      mockNetwork.mockRejectedValueOnce(err);

      await expect(client.createAccount("account-1")).rejects.toEqual(
        expect.objectContaining({
          name: "A4HttpError",
          status: 500,
          message: "internal server error",
        }),
      );
    });

    it("sends PUT with Ledger Wallet source tag and returns version", async () => {
      mockNetwork.mockResolvedValueOnce({
        data: "bd348b6a640c2c766f6e03ecda7a772e9220c53495e61d962ece79ee306e914c",
        status: 201,
        headers: {
          "a4-account-version": "bd348b6a640c2c766f6e03ecda7a772e9220c53495e61d962ece79ee306e914c",
        },
      });

      const result = await client.createAccount("account-1");

      expect(result).toEqual({
        data: "bd348b6a640c2c766f6e03ecda7a772e9220c53495e61d962ece79ee306e914c",
        version: "bd348b6a640c2c766f6e03ecda7a772e9220c53495e61d962ece79ee306e914c",
      });
      expect(mockNetwork).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "PUT",
          data: { tags: [{ key: "source", value: "Ledger Wallet" }] },
        }),
      );
    });
  });

  describe("addAddresses", () => {
    it("sends addresses as a plain array and returns new version", async () => {
      mockNetwork.mockResolvedValueOnce({
        data: "bd348b6a640c2c766f6e03ecda7a772e9220c53495e61d962ece79ee306e914c",
        status: 200,
        headers: {
          "a4-account-version": "bd348b6a640c2c766f6e03ecda7a772e9220c53495e61d962ece79ee306e914c",
        },
      });

      const result = await client.addAddresses(
        "account-1",
        ["0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"],
        "bd348b6a640c2c766f6e03ecda7a772e9220c53495e61d962ece79ee306e914c",
      );

      expect(result).toEqual({
        data: "bd348b6a640c2c766f6e03ecda7a772e9220c53495e61d962ece79ee306e914c",
        version: "bd348b6a640c2c766f6e03ecda7a772e9220c53495e61d962ece79ee306e914c",
      });
      expect(mockNetwork).toHaveBeenCalledWith(
        expect.objectContaining({ data: ["0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"] }),
      );
    });

    it("falls back to body version when A4-Account-Version header is absent", async () => {
      mockNetwork.mockResolvedValueOnce({
        data: "bd348b6a640c2c766f6e03ecda7a772e9220c53495e61d962ece79ee306e914c",
        status: 200,
        headers: {},
      });

      const result = await client.addAddresses("account-1", [
        "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
      ]);

      expect(result).toEqual({
        data: "bd348b6a640c2c766f6e03ecda7a772e9220c53495e61d962ece79ee306e914c",
        version: "bd348b6a640c2c766f6e03ecda7a772e9220c53495e61d962ece79ee306e914c",
      });
    });

    it("throws A4HttpError with status 412 and message on version mismatch", async () => {
      const err = Object.assign(new Error("version mismatch"), {
        name: "LedgerAPI4xx",
        status: 412,
      });
      mockNetwork.mockRejectedValueOnce(err);

      await expect(
        client.addAddresses("account-1", ["0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"]),
      ).rejects.toEqual(
        expect.objectContaining({ name: "A4HttpError", status: 412, message: "version mismatch" }),
      );
    });
  });

  describe("getBalance", () => {
    it("throws A4HttpError with status 404 and message when account not found", async () => {
      const err = Object.assign(new Error("account not found"), {
        name: "LedgerAPI4xx",
        status: 404,
      });
      mockNetwork.mockRejectedValueOnce(err);

      await expect(client.getBalance("account-1")).rejects.toEqual(
        expect.objectContaining({ name: "A4HttpError", status: 404, message: "account not found" }),
      );
    });

    it("returns balance assets and version", async () => {
      mockNetwork.mockResolvedValueOnce({
        data: { assets: { native: "100000000" } },
        status: 200,
        headers: {
          "a4-account-version": "bd348b6a640c2c766f6e03ecda7a772e9220c53495e61d962ece79ee306e914c",
        },
      });

      const result = await client.getBalance("account-1");

      expect(result).toEqual({
        data: { assets: { native: "100000000" } },
        version: "bd348b6a640c2c766f6e03ecda7a772e9220c53495e61d962ece79ee306e914c",
      });
    });
  });

  describe("listOperations", () => {
    it("throws A4HttpError with status 500 and message on server error", async () => {
      const err = Object.assign(new Error("internal server error"), {
        name: "LedgerAPI5xx",
        status: 500,
      });
      mockNetwork.mockRejectedValueOnce(err);

      await expect(client.listOperations("account-1", {})).rejects.toEqual(
        expect.objectContaining({
          name: "A4HttpError",
          status: 500,
          message: "internal server error",
        }),
      );
    });

    const operation = {
      block: { hash: "0xabc", height: 1234567, time: "2024-01-01T00:00:00Z" },
      tx: {
        hash: "0xd69d45f90fd7c26d30ea83691b66618ac5b85d3c3e216734c2f938fa99a07342",
        index: 0,
      },
      assets: { native: "-1000000" },
      events: {},
      failed: false,
      fees: "21000",
      feeAsset: "native",
      senders: ["0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"],
      recipients: ["0xdAC17F958D2ee523a2206206994597C13D831ec7"],
    };

    it("serializes a two-number blocks range", async () => {
      mockNetwork.mockResolvedValueOnce({
        data: { items: [operation], nextToken: "opaque-cursor" },
        status: 200,
        headers: {
          "a4-account-version": "bd348b6a640c2c766f6e03ecda7a772e9220c53495e61d962ece79ee306e914c",
        },
      });

      await client.listOperations("account-1", { blocks: [0, 1000000], size: 100 });

      expect(mockNetwork).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({ blocks: "[0,1000000]", size: 100 }),
        }),
      );
    });

    it("defaults blocks to [0, latest] when omitted", async () => {
      mockNetwork.mockResolvedValueOnce({
        data: { items: [operation] },
        status: 200,
        headers: {
          "a4-account-version": "bd348b6a640c2c766f6e03ecda7a772e9220c53495e61d962ece79ee306e914c",
        },
      });

      await client.listOperations("account-1", { size: 50 });

      expect(mockNetwork).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({ blocks: '[0,"latest"]', size: 50 }),
        }),
      );
    });
  });
});
