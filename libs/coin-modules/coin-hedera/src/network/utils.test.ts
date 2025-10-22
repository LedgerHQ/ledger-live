import BigNumber from "bignumber.js";
import type { HederaMirrorCoinTransfer, HederaMirrorTokenTransfer } from "../types";
import { parseTransfers } from "./utils";

const createMirrorCoinTransfer = (account: string, amount: number): HederaMirrorCoinTransfer => ({
  account,
  amount,
});

const createMirrorTokenTransfer = (
  account: string,
  amount: number,
  tokenId: string,
): HederaMirrorTokenTransfer => ({
  token_id: tokenId,
  account,
  amount,
});

describe("parseTransfers", () => {
  it("should correctly identify an incoming transfer", () => {
    const userAddress = "0.0.1234";
    const transfers = [
      createMirrorCoinTransfer("0.0.5678", -100),
      createMirrorCoinTransfer(userAddress, 100),
    ];

    const result = parseTransfers(transfers, userAddress);

    expect(result.type).toBe("IN");
    expect(result.value).toEqual(new BigNumber(100));
    expect(result.senders).toEqual(["0.0.5678"]);
    expect(result.recipients).toEqual([userAddress]);
  });

  it("should correctly identify an outgoing transfer", () => {
    const userAddress = "0.0.1234";
    const transfers = [
      createMirrorCoinTransfer(userAddress, -100),
      createMirrorCoinTransfer("0.0.5678", 100),
    ];

    const result = parseTransfers(transfers, userAddress);

    expect(result.type).toBe("OUT");
    expect(result.value).toEqual(new BigNumber(100));
    expect(result.senders).toEqual([userAddress]);
    expect(result.recipients).toEqual(["0.0.5678"]);
  });

  it("should handle multiple senders and recipients", () => {
    const userAddress = "0.0.1234";
    const transfers = [
      createMirrorCoinTransfer("0.0.5678", -50),
      createMirrorCoinTransfer(userAddress, -50),
      createMirrorCoinTransfer("0.0.9999", 100),
    ];

    const result = parseTransfers(transfers, userAddress);

    expect(result.type).toBe("OUT");
    expect(result.value).toEqual(new BigNumber(50));
    expect(result.senders).toEqual(["0.0.1234", "0.0.5678"]);
    expect(result.recipients).toEqual(["0.0.9999"]);
  });

  it("should correctly process token transfers", () => {
    const userAddress = "0.0.1234";
    const tokenId = "0.0.7777";
    const transfers = [
      createMirrorTokenTransfer(userAddress, -10, tokenId),
      createMirrorTokenTransfer("0.0.5678", 10, tokenId),
    ];

    const result = parseTransfers(transfers, userAddress);

    expect(result.type).toBe("OUT");
    expect(result.value).toEqual(new BigNumber(10));
    expect(result.senders).toEqual([userAddress]);
    expect(result.recipients).toEqual(["0.0.5678"]);
  });

  it("should exclude system accounts that are not nodes from recipients", () => {
    const userAddress = "0.0.1234";
    const systemAccount = "0.0.500";
    const transfers = [
      createMirrorCoinTransfer(userAddress, -100),
      createMirrorCoinTransfer(systemAccount, 100),
    ];

    const result = parseTransfers(transfers, userAddress);

    expect(result.type).toBe("OUT");
    expect(result.value).toEqual(new BigNumber(100));
    expect(result.senders).toEqual([userAddress]);
    expect(result.recipients).toEqual([]);
  });

  it("should include node accounts as recipients only if no other recipients", () => {
    const userAddress = "0.0.1234";
    const nodeAccount = "0.0.3";
    const transfers = [
      createMirrorCoinTransfer(userAddress, -100),
      createMirrorCoinTransfer(nodeAccount, 100),
    ];

    const result = parseTransfers(transfers, userAddress);

    expect(result.type).toBe("OUT");
    expect(result.value).toEqual(new BigNumber(100));
    expect(result.senders).toEqual([userAddress]);
    expect(result.recipients).toEqual([nodeAccount]);
  });

  it("should exclude node accounts if there are other recipients", () => {
    const userAddress = "0.0.1234";
    const normalAccount = "0.0.5678";
    const nodeAccount = "0.0.3";
    const transfers = [
      createMirrorCoinTransfer(userAddress, -100),
      createMirrorCoinTransfer(normalAccount, 50),
      createMirrorCoinTransfer(nodeAccount, 50),
    ];

    const result = parseTransfers(transfers, userAddress);

    expect(result.type).toBe("OUT");
    expect(result.value).toEqual(new BigNumber(100));
    expect(result.senders).toEqual([userAddress]);
    expect(result.recipients).toEqual([normalAccount]);
  });

  it("should handle transactions where user is not involved", () => {
    const userAddress = "0.0.1234";
    const transfers = [
      createMirrorCoinTransfer("0.0.5678", -100),
      createMirrorCoinTransfer("0.0.9999", 100),
    ];

    const result = parseTransfers(transfers, userAddress);

    expect(result.type).toBe("NONE");
    expect(result.value).toEqual(new BigNumber(0));
    expect(result.senders).toEqual(["0.0.5678"]);
    expect(result.recipients).toEqual(["0.0.9999"]);
  });

  it("should handle empty transfers array", () => {
    const userAddress = "0.0.1234";
    const transfers: HederaMirrorCoinTransfer[] = [];

    const result = parseTransfers(transfers, userAddress);

    expect(result.type).toBe("NONE");
    expect(result.value).toEqual(new BigNumber(0));
    expect(result.senders).toEqual([]);
    expect(result.recipients).toEqual([]);
  });

  it("should reverse the order of senders and recipients", () => {
    const userAddress = "0.0.1234";
    const transfers = [
      createMirrorCoinTransfer("0.0.900", -5),
      createMirrorCoinTransfer("0.0.5678", -95),
      createMirrorCoinTransfer(userAddress, 100),
    ];

    const result = parseTransfers(transfers, userAddress);

    expect(result.type).toBe("IN");
    expect(result.value).toEqual(new BigNumber(100));
    expect(result.senders).toEqual(["0.0.5678", "0.0.900"]);
    expect(result.recipients).toEqual([userAddress]);
  });
});
