import { additionalErc20SignaturesBlob } from "../../../src/services/ledger/data";

jest.mock("@ledgerhq/hw-app-eth", () => ({
  __esModule: true,
  ledgerService: {
    parseTransaction: jest.fn(),
    resolveTransaction: jest.fn(),
    signAddressResolution: jest.fn(),
    signDomainResolution: jest.fn(),
  },
  RLP: {
    decode: jest.fn(),
    encode: jest.fn(),
  },
}));

jest.mock("@ethersproject/bytes", () => ({
  __esModule: true,
  arrayify: jest.fn(),
}));

jest.mock("@ethersproject/keccak256", () => ({
  __esModule: true,
  keccak256: jest.fn(),
}));

import { ledgerService, RLP } from "@ledgerhq/hw-app-eth";
import { arrayify } from "@ethersproject/bytes";
import { keccak256 } from "@ethersproject/keccak256";
import ledgerServiceCelo from "../../../src/services/ledger";

const mockedLedgerService = ledgerService as jest.Mocked<typeof ledgerService>;
const mockedRlp = RLP as jest.Mocked<typeof RLP>;
const mockedArrayify = arrayify as jest.MockedFunction<typeof arrayify>;
const mockedKeccak256 = keccak256 as jest.MockedFunction<typeof keccak256>;

describe("Celo ledger service (index.ts)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("parseTransaction converts CIP64 into EIP-1559, then restores CIP64 fields", () => {
    const payload = Uint8Array.from([0x7b, 0xaa, 0xbb, 0xcc]);
    const feeCurrency = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
    const fields = [
      "0xa4ec",
      "0x",
      "0x09",
      "0x64",
      "0x5208",
      "0x71c7656ec7ab88b098defb751b7401b5f6d8976f",
      "0x",
      "0x",
      [],
      feeCurrency,
      "0x1b",
      "0x01",
      "0x02",
    ];

    mockedArrayify.mockReturnValue(payload);
    mockedRlp.decode.mockReturnValue(fields as never);
    mockedRlp.encode.mockReturnValue("0xdeadbeef" as never);
    mockedLedgerService.parseTransaction.mockReturnValue({
      type: 2,
      hash: "0xold",
      to: "0x1234",
    } as never);
    mockedKeccak256.mockReturnValue("0xcorrecthash");

    const result = ledgerServiceCelo.parseTransaction("0xraw");

    expect(mockedArrayify).toHaveBeenCalledWith("0xraw");
    expect(mockedRlp.decode).toHaveBeenCalledWith(payload.slice(1));
    expect(mockedRlp.encode).toHaveBeenCalledWith([
      ...fields.slice(0, 9),
      ...fields.slice(10),
    ]);
    expect(mockedLedgerService.parseTransaction).toHaveBeenCalledWith("0x02deadbeef");
    expect(mockedKeccak256).toHaveBeenCalledWith(payload);
    expect(result).toMatchObject({
      type: 0x7b,
      hash: "0xcorrecthash",
      feeCurrency,
      to: "0x1234",
    });
  });

  it("parseTransaction delegates non-CIP64 transactions directly", () => {
    const payload = Uint8Array.from([0x02, 0xaa]);
    const parsed = { type: 2, to: "0xabcd" };

    mockedArrayify.mockReturnValue(payload);
    mockedLedgerService.parseTransaction.mockReturnValue(parsed as never);

    const result = ledgerServiceCelo.parseTransaction("0x02aa");

    expect(mockedLedgerService.parseTransaction).toHaveBeenCalledWith("0x02aa");
    expect(mockedRlp.decode).not.toHaveBeenCalled();
    expect(result).toBe(parsed);
  });

  it("resolveTransaction passes additional ERC20 config when CIP64 feeCurrency exists", async () => {
    const rawTxHex = "7baa";
    const payload = Uint8Array.from([0x7b, 0xaa]);
    const feeCurrency = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
    const fields = ["0xa4ec", "0x", "0x09", "0x64", "0x5208", "0x1", "0x", "0x", [], feeCurrency];
    const resolution = { nfts: [], erc20Tokens: [] };
    const loadConfig = {};
    const resolutionConfig = { nft: false, erc20: false, externalPlugins: false };

    mockedArrayify.mockReturnValue(payload);
    mockedRlp.decode.mockReturnValue(fields as never);
    mockedRlp.encode.mockReturnValue("0xabc123" as never);
    mockedLedgerService.parseTransaction.mockReturnValue({ type: 2 } as never);
    mockedKeccak256.mockReturnValue("0xhash");
    mockedLedgerService.resolveTransaction.mockResolvedValue(resolution as never);

    const result = await ledgerServiceCelo.resolveTransaction(rawTxHex, loadConfig, resolutionConfig);

    expect(mockedLedgerService.resolveTransaction).toHaveBeenCalledWith(
      rawTxHex,
      loadConfig,
      resolutionConfig,
      expect.any(Function),
      {
        additionalErc20SignaturesBlob,
        contractAddressToResolve: feeCurrency,
      },
    );
    expect(result).toBe(resolution);
  });

  it("resolveTransaction omits additional ERC20 config when feeCurrency is empty", async () => {
    const rawTxHex = "7bbb";
    const payload = Uint8Array.from([0x7b, 0xbb]);
    const fields = ["0xa4ec", "0x", "0x09", "0x64", "0x5208", "0x1", "0x", "0x", [], ""];
    const loadConfig = {};
    const resolutionConfig = { nft: false, erc20: false, externalPlugins: false };

    mockedArrayify.mockReturnValue(payload);
    mockedRlp.decode.mockReturnValue(fields as never);
    mockedRlp.encode.mockReturnValue("0xabc999" as never);
    mockedLedgerService.parseTransaction.mockReturnValue({ type: 2 } as never);
    mockedKeccak256.mockReturnValue("0xhash");
    mockedLedgerService.resolveTransaction.mockResolvedValue({} as never);

    await ledgerServiceCelo.resolveTransaction(rawTxHex, loadConfig, resolutionConfig);

    expect(mockedLedgerService.resolveTransaction).toHaveBeenCalledWith(
      rawTxHex,
      loadConfig,
      resolutionConfig,
      expect.any(Function),
      undefined,
    );
  });

  it("exports signer helpers from base ledger service", () => {
    expect(ledgerServiceCelo.signAddressResolution).toBe(mockedLedgerService.signAddressResolution);
    expect(ledgerServiceCelo.signDomainResolution).toBe(mockedLedgerService.signDomainResolution);
  });
});
