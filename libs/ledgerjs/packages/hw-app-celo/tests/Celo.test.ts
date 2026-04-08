import { openTransportReplayer, RecordStore } from "@ledgerhq/hw-transport-mocker";
import Eth from "@ledgerhq/hw-app-eth";
import Celo from "../src/Celo";

jest.mock("@celo/wallet-base", () => ({
  rlpEncodedTx: jest.fn().mockReturnValue({ type: "cip64", rlpEncode: "0xmock" }),
  LegacyEncodedTx: jest.fn(),
}));

import { rlpEncodedTx } from "@celo/wallet-base";

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
  });

  jest.dontMock("@ledgerhq/hw-app-eth");
  jest.dontMock("../src/services/ledger");
});

test("Celo signTransaction delegates to Eth super method", async () => {
  jest.resetModules();

  const signTransaction = jest.fn().mockResolvedValue({
    s: "0x1",
    v: "0x2",
    r: "0x3",
  });

  jest.doMock("@ledgerhq/hw-app-eth", () => ({
    __esModule: true,
    default: class EthMock {
      constructor() {}
      signTransaction = signTransaction;
    },
  }));

  jest.doMock("../src/services/ledger", () => ({
    __esModule: true,
    default: { getAddress: jest.fn() },
  }));

  await jest.isolateModulesAsync(async () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const IsolatedCelo = require("../src/Celo").default;
    const transport = { exchange: jest.fn() };
    const celo = new IsolatedCelo(transport);
    const path = "44'/52752'/0'/0/0";
    const rawTxHex = "deadbeef";

    const result = await celo.signTransaction(path, rawTxHex);

    expect(signTransaction).toHaveBeenCalledWith(path, rawTxHex);
    expect(result).toEqual({ s: "0x1", v: "0x2", r: "0x3" });
  });

  jest.dontMock("@ledgerhq/hw-app-eth");
  jest.dontMock("../src/services/ledger");
});

test("Celo signTransaction forwards path and rawTxHex to Eth prototype", async () => {
  const transport = await openTransportReplayer(RecordStore.fromString(""));
  const celo = new Celo(transport);
  const spy = jest
    .spyOn(Eth.prototype, "signTransaction")
    .mockResolvedValue({ s: "0x1", v: "0x2", r: "0x3" });

  const result = await celo.signTransaction("44'/52752'/0'/0/0", "deadbeef");

  expect(spy).toHaveBeenCalledWith("44'/52752'/0'/0/0", "deadbeef");
  expect(result).toEqual({ s: "0x1", v: "0x2", r: "0x3" });
  spy.mockRestore();
});

test("Celo init", async () => {
  const transport = await openTransportReplayer(RecordStore.fromString(""));
  const celo = new Celo(transport);
  expect(celo).toBeInstanceOf(Celo);
});

test("Celo rlpEncodedTxForLedger delegates to @celo/wallet-base rlpEncodedTx", async () => {
  const transport = await openTransportReplayer(RecordStore.fromString(""));
  const celo = new Celo(transport);

  const mockTxParams = {
    from: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
    to: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    value: "1000000000000000000",
    nonce: 0,
    gas: 21000,
    chainId: 42220,
  };

  const result = await celo.rlpEncodedTxForLedger(mockTxParams as any);

  expect(rlpEncodedTx).toHaveBeenCalledWith(mockTxParams);
  expect(result).toEqual({ type: "cip64", rlpEncode: "0xmock" });
});
