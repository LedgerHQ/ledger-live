import { openTransportReplayer, RecordStore } from "@ledgerhq/hw-transport-mocker";
import Celo from "../src/Celo";

test("Celo constructor passes ledger service to Eth super constructor", () => {
  jest.resetModules();

  const ethConstructor = jest.fn();
  const mockedLedgerService = { getAddress: jest.fn() };

  jest.doMock("@ledgerhq/hw-app-eth", () => ({
    __esModule: true,
    default: class EthMock {
      constructor(...args: unknown[]) {
        ethConstructor(...args);
      }
    },
  }));

  jest.doMock("../src/services/ledger", () => ({
    __esModule: true,
    default: mockedLedgerService,
  }));

  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const IsolatedCelo = require("../src/Celo").default;
    const transport = { exchange: jest.fn() };

    new IsolatedCelo(transport);

    expect(ethConstructor).toHaveBeenCalledWith(
      transport,
      undefined,
      undefined,
      mockedLedgerService,
    );

    ethConstructor.mockClear();
    const loadConfig = { calServiceURL: "https://cal.example.com" };
    new IsolatedCelo(transport, "custom-scramble", loadConfig);

    expect(ethConstructor).toHaveBeenCalledWith(
      transport,
      "custom-scramble",
      loadConfig,
      mockedLedgerService,
    );
  });

  jest.dontMock("@ledgerhq/hw-app-eth");
  jest.dontMock("../src/services/ledger");
});

test("Celo signTransaction resolves via Celo ledger service then delegates to Eth super", async () => {
  jest.resetModules();

  const fakeResolution = { nfts: [], erc20Tokens: [], externalPlugin: [], plugin: [], domains: [] };
  const resolveTransaction = jest.fn().mockResolvedValue(fakeResolution);
  const signTransaction = jest.fn().mockResolvedValue({ s: "0x1", v: "0x2", r: "0x3" });
  const mockedLedgerService = {
    resolveTransaction,
    parseTransaction: jest.fn(),
    signAddressResolution: jest.fn(),
    signDomainResolution: jest.fn(),
  };

  class EthMock {
    ledgerService: typeof mockedLedgerService;
    loadConfig = { calServiceURL: "https://cal.example.com" };
    constructor(_transport: unknown, _scrambleKey: unknown, _loadConfig: unknown, ls: unknown) {
      this.ledgerService = ls as typeof mockedLedgerService;
    }
    async signTransaction(
      path: string,
      rawTxHex: string,
      resolution?: unknown,
    ): Promise<{ s: string; v: string; r: string }> {
      return signTransaction(path, rawTxHex, resolution);
    }
  }

  jest.doMock("@ledgerhq/hw-app-eth", () => ({
    __esModule: true,
    default: EthMock,
  }));

  jest.doMock("../src/services/ledger", () => ({
    __esModule: true,
    default: mockedLedgerService,
  }));

  await jest.isolateModulesAsync(async () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const IsolatedCelo = require("../src/Celo").default;
    const transport = { exchange: jest.fn() };
    const celo = new IsolatedCelo(transport);
    const path = "44'/52752'/0'/0/0";
    const rawTxHex = "deadbeef";

    const result = await celo.signTransaction(path, rawTxHex);

    expect(resolveTransaction).toHaveBeenCalledWith(
      rawTxHex,
      { calServiceURL: "https://cal.example.com" },
      { externalPlugins: true, erc20: true, uniswapV3: false },
    );
    expect(signTransaction).toHaveBeenCalledWith(path, rawTxHex, fakeResolution);
    expect(result).toEqual({ s: "0x1", v: "0x2", r: "0x3" });
  });

  jest.dontMock("@ledgerhq/hw-app-eth");
  jest.dontMock("../src/services/ledger");
});

test("Celo signTransaction falls back to blind signing when resolveTransaction fails", async () => {
  jest.resetModules();

  const resolveTransaction = jest.fn().mockRejectedValue(new Error("network down"));
  const signTransaction = jest.fn().mockResolvedValue({ s: "0x1", v: "0x2", r: "0x3" });
  const mockedLedgerService = {
    resolveTransaction,
    parseTransaction: jest.fn(),
    signAddressResolution: jest.fn(),
    signDomainResolution: jest.fn(),
  };
  const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

  class EthMock {
    ledgerService: typeof mockedLedgerService;
    loadConfig = {};
    constructor(_transport: unknown, _scrambleKey: unknown, _loadConfig: unknown, ls: unknown) {
      this.ledgerService = ls as typeof mockedLedgerService;
    }
    async signTransaction(
      path: string,
      rawTxHex: string,
      resolution?: unknown,
    ): Promise<{ s: string; v: string; r: string }> {
      return signTransaction(path, rawTxHex, resolution);
    }
  }

  jest.doMock("@ledgerhq/hw-app-eth", () => ({
    __esModule: true,
    default: EthMock,
  }));

  jest.doMock("../src/services/ledger", () => ({
    __esModule: true,
    default: mockedLedgerService,
  }));

  await jest.isolateModulesAsync(async () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const IsolatedCelo = require("../src/Celo").default;
    const celo = new IsolatedCelo({ exchange: jest.fn() });

    await celo.signTransaction("path", "hex");

    expect(signTransaction).toHaveBeenCalledWith("path", "hex", null);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("resolveTransaction failed, falling back to blind signing"),
    );
  });

  warnSpy.mockRestore();
  jest.dontMock("@ledgerhq/hw-app-eth");
  jest.dontMock("../src/services/ledger");
});

test("Celo init", async () => {
  const transport = await openTransportReplayer(RecordStore.fromString(""));
  const celo = new Celo(transport);
  expect(celo).toBeInstanceOf(Celo);
});
