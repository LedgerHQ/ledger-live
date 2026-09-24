import type { Operation } from "@ledgerhq/types-live";
import {
  getTransactionExplorer,
  isValidBase64,
  isValidHex,
  messageCidToEthHash,
  methodToString,
} from "./utils";

test("methodToString", () => {
  const str1 = methodToString(0);
  expect(str1).toBe("Transfer");
  const str2 = methodToString(3844450837);
  expect(str2).toBe("InvokeEVM (3844450837)");
  const str3 = methodToString(5649856);
  expect(str3).toBe("Unknown");
});

test("isValidHex", () => {
  expect(isValidHex("0x0001aaeeff")).toBe(true);
  expect(isValidHex("0001aaeeff")).toBe(true);
  expect(isValidHex("0x0001rreeta")).toBe(false);
  expect(isValidHex("0x0001aaeef")).toBe(false);
});

test("isValidBase64", () => {
  expect(isValidBase64("YXNkYWZhc2Rmc2Rm")).toBe(true);
  expect(
    isValidBase64(
      "YXNmZHNhZGZzYWRmYXNkZnNhZGZzYWRmYXNkZnNhZGYyNTEyMzQxMjIzcjZmYXM0MmZhczJkMTNhc2M=",
    ),
  ).toBe(true);
  expect(isValidBase64("asdasd````")).toBe(false);
});

describe("messageCidToEthHash", () => {
  const cid = "bafy2bzacecsnwpizr2wvzm3jcgzfwyaprhdvvnsc33xdmx37gpm6zuaorkuce";
  const ethHash = "0xa4db3d198ead5cb36911b25b600f89c75ab642deee365f7f33d9ecd00e8aa822";

  test("maps a message CID to its Ethereum transaction hash", () => {
    expect(messageCidToEthHash(cid)).toBe(ethHash);
  });

  test("keeps an Ethereum transaction hash unchanged", () => {
    expect(messageCidToEthHash(ethHash)).toBe(ethHash);
  });

  test("keeps a malformed CID unchanged", () => {
    expect(
      messageCidToEthHash("bafy2bzacec!nwpizr2wvzm3jcgzfwyaprhdvvnsc33xdmx37gpm6zuaorkuce"),
    ).toBe("bafy2bzacec!nwpizr2wvzm3jcgzfwyaprhdvvnsc33xdmx37gpm6zuaorkuce");
    expect(
      messageCidToEthHash("bafy2bzacecsnwpizr2wvzm3jcgzfwyaprhdvvnsc33xdmx37gpm6zuaorku"),
    ).toBe("bafy2bzacecsnwpizr2wvzm3jcgzfwyaprhdvvnsc33xdmx37gpm6zuaorku");
    expect(messageCidToEthHash("")).toBe("");
  });
});

describe("getTransactionExplorer", () => {
  const explorerView = { tx: "https://filecoin.blockscout.com/tx/$hash" };
  const operation = {
    hash: "bafy2bzacecsnwpizr2wvzm3jcgzfwyaprhdvvnsc33xdmx37gpm6zuaorkuce",
  } as Operation;

  test("builds the explorer link from the Ethereum transaction hash", () => {
    expect(getTransactionExplorer(explorerView, operation)).toBe(
      "https://filecoin.blockscout.com/tx/0xa4db3d198ead5cb36911b25b600f89c75ab642deee365f7f33d9ecd00e8aa822",
    );
  });

  test("returns undefined without a transaction explorer", () => {
    expect(getTransactionExplorer(undefined, operation)).toBeUndefined();
    expect(getTransactionExplorer({}, operation)).toBeUndefined();
  });
});
