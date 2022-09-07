import "../__tests__/test-helpers/setup";
import { BigNumber } from "bignumber.js";
import eip55 from "eip55";
import { getAccountBridge } from "../bridge";
import { parseCallRequest } from "./index";
import type { WCPayloadTransaction } from "./index";
import { getCryptoCurrencyById, setSupportedCurrencies } from "../currencies";
import { emptyHistoryCache } from "../account";
import { setEnv } from "../env";
import type { Account } from "@ledgerhq/types-live";

describe("walletconnect", () => {
  const account: Account = {
    type: "Account",
    id: "js:2:ethereum:0xCA220B75b7aF206bFCc67E2EcE06E2e144FA294a:",
    derivationMode: "",
    freshAddressPath: "44'/60'/0'/0/0",
    currency: getCryptoCurrencyById("ethereum"),
    seedIdentifier: "",
    index: 0,
    freshAddress: "",
    freshAddresses: [],
    name: "test",
    starred: false,
    used: true,
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
    creationDate: new Date(),
    blockHeight: 1,
    unit: getCryptoCurrencyById("ethereum").units[0],
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    lastSyncDate: new Date(),
    swapHistory: [],
    balanceHistoryCache: emptyHistoryCache,
  };
  beforeAll(() => {
    setEnv("MOCK", true);
    setSupportedCurrencies(["ethereum"]);
  });
  afterAll(() => {
    setEnv("MOCK", false);
  });
  test("should fail on wrong payload", async () => {
    await expect(
      parseCallRequest(account, {
        method: "pouet",
        params: [],
        id: "pouet",
      })
    ).rejects.toThrow("wrong payload");
  });

  test("should parse personal_sign payloads", async () => {
    expect(
      await parseCallRequest(account, {
        id: "1606134269395933",
        method: "personal_sign",
        params: [
          "0x4d7920656d61696c206973206a6f686e40646f652e636f6d202d2031353337383336323036313031",
          "0xCA220B75b7aF206bFCc67E2EcE06E2e144FA294a",
        ],
      })
    ).toMatchObject({
      data: {
        currency: getCryptoCurrencyById("ethereum"),
        derivationMode: "",
        message: "My email is john@doe.com - 1537836206101",
        rawMessage:
          "0x4d7920656d61696c206973206a6f686e40646f652e636f6d202d2031353337383336323036313031",
        path: "44'/60'/0'/0/0",
        hashes: {
          stringHash:
            "0x4a15deb26c7084592efc4a5e5dbadfa43ea596391461421145705a1f86494ddd",
        },
      },
      type: "message",
    });
  });

  test("should parse eth_sign payloads", async () => {
    expect(
      await parseCallRequest(account, {
        id: "1606134269395933",
        jsonrpc: "2.0",
        method: "eth_sign",
        params: [
          "0xe44F9E113Fbd671Bf697d5a1cf1716E1a8c3F35b",
          "0xbfe79ce1b9258204beff46707c50b88a11e02feda203f7f269ab3cf0520fa62f",
        ],
      } as any)
    ).toMatchObject({
      data: {
        currency: getCryptoCurrencyById("ethereum"),
        derivationMode: "",
        message:
          "0xbfe79ce1b9258204beff46707c50b88a11e02feda203f7f269ab3cf0520fa62f",
        rawMessage:
          "0xbfe79ce1b9258204beff46707c50b88a11e02feda203f7f269ab3cf0520fa62f",
        path: "44'/60'/0'/0/0",
        hashes: {
          stringHash:
            "0x8e7d1635f8457e4ee06862eedde10b668d6e746962af6ba54807fb99493fc5cb",
        },
      },
      type: "message",
    });
  });

  test("should parse eth_signTypedData payloads", async () => {
    const raw =
      '{"types":{"EIP712Domain":[{"name":"name","type":"string"},{"name":"version","type":"string"},{"name":"verifyingContract","type":"address"}],"RelayRequest":[{"name":"target","type":"address"},{"name":"encodedFunction","type":"bytes"},{"name":"gasData","type":"GasData"},{"name":"relayData","type":"RelayData"}],"GasData":[{"name":"gasLimit","type":"uint256"},{"name":"gasPrice","type":"uint256"},{"name":"pctRelayFee","type":"uint256"},{"name":"baseRelayFee","type":"uint256"}],"RelayData":[{"name":"senderAddress","type":"address"},{"name":"senderNonce","type":"uint256"},{"name":"relayWorker","type":"address"},{"name":"paymaster","type":"address"}]},"domain":{"name":"GSN Relayed Transaction","version":"1","chainId":42,"verifyingContract":"0x6453D37248Ab2C16eBd1A8f782a2CBC65860E60B"},"primaryType":"RelayRequest","message":{"target":"0x9cf40ef3d1622efe270fe6fe720585b4be4eeeff","encodedFunction":"0xa9059cbb0000000000000000000000002e0d94754b348d208d64d52d78bcd443afa9fa520000000000000000000000000000000000000000000000000000000000000007","gasData":{"gasLimit":"39507","gasPrice":"1700000000","pctRelayFee":"70","baseRelayFee":"0"},"relayData":{"senderAddress":"0x22d491bde2303f2f43325b2108d26f1eaba1e32b","senderNonce":"3","relayWorker":"0x3baee457ad824c94bd3953183d725847d023a2cf","paymaster":"0x957F270d45e9Ceca5c5af2b49f1b5dC1Abb0421c"}}}';
    expect(
      await parseCallRequest(account, {
        id: "1606135178131543",
        method: "eth_signTypedData",
        params: ["0xCA220B75b7aF206bFCc67E2EcE06E2e144FA294a", raw],
      })
    ).toMatchObject({
      data: {
        currency: getCryptoCurrencyById("ethereum"),
        derivationMode: "",
        message: JSON.parse(raw),
        path: "44'/60'/0'/0/0",
        hashes: {
          domainHash:
            "0x4ffaf9cb7df9fe0016d5ea8358cb61ec61875d98a856982d216015abbf371227",
          messageHash:
            "0x401419776f57f5162dd05a3072f5941868ac4decfa789e501598997c48a43488",
        },
      },
      type: "message",
    });
  });

  test("should parse eth_sendTransaction payloads", async () => {
    const raw: WCPayloadTransaction = {
      data: "0x",
      from: "0xCA220B75b7aF206bFCc67E2EcE06E2e144FA294a",
      gas: "0x5208",
      gasPrice: "0xb2d05e000",
      nonce: "0x15",
      to: "0xCA220B75b7aF206bFCc67E2EcE06E2e144FA294a",
      value: "0x0",
    };
    const bridge = getAccountBridge(account);
    let transaction = bridge.createTransaction(account);
    transaction = bridge.updateTransaction(transaction, {
      data: Buffer.from(raw.data.slice(2), "hex"),
      // $FlowFixMe
      amount: new BigNumber(raw.value as string, 16),
      recipient: raw.to,
      // $FlowFixMe
      gasPrice: new BigNumber(raw.gasPrice as string, 16),
      nonce: raw.nonce,
    });
    transaction = bridge.updateTransaction(transaction, {
      // $FlowFixMe
      userGasLimit: new BigNumber(raw.gas as string, 16),
    });
    transaction = await bridge.prepareTransaction(account, transaction);
    delete transaction.networkInfo;
    delete transaction.gasPrice;
    expect(
      await parseCallRequest(account, {
        id: "1606135657415541",
        method: "eth_sendTransaction",
        params: [raw],
      })
    ).toMatchObject({
      data: transaction,
      method: "send",
      type: "transaction",
    });
  });
  test("should parse eth_sendTransaction payloads and eip55 encode lowercase addresses", async () => {
    const raw: WCPayloadTransaction = {
      data: "0x",
      from: "0xCA220B75b7aF206bFCc67E2EcE06E2e144FA294a",
      gas: "0x5208",
      gasPrice: "0xb2d05e000",
      nonce: "0x15",
      to: "0xca220b75b7af206bfcc67e2ece06e2e144fa294a",
      value: "0x0",
    };
    const bridge = getAccountBridge(account);
    let transaction = bridge.createTransaction(account);
    transaction = bridge.updateTransaction(transaction, {
      data: Buffer.from(raw.data.slice(2), "hex"),
      // $FlowFixMe
      amount: new BigNumber(raw.value as string, 16),
      recipient: eip55.encode(raw.to as string),
      // $FlowFixMe
      gasPrice: new BigNumber(raw.gasPrice as string, 16),
      nonce: raw.nonce,
    });
    transaction = bridge.updateTransaction(transaction, {
      // $FlowFixMe
      userGasLimit: new BigNumber(raw.gas as string, 16),
    });
    transaction = await bridge.prepareTransaction(account, transaction);
    delete transaction.networkInfo;
    delete transaction.gasPrice;
    expect(
      await parseCallRequest(account, {
        id: "1606135657415541",
        method: "eth_sendTransaction",
        params: [raw],
      })
    ).toMatchObject({
      data: transaction,
      method: "send",
      type: "transaction",
    });
  });
});
