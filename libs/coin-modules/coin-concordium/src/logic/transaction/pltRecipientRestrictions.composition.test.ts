import {
  ConcordiumRecipientDenied,
  ConcordiumRecipientNotAllowed,
  ConcordiumRecipientNotFound,
  ConcordiumRecipientRestrictionsUnverified,
} from "../../types/errors";
import type { ConcordiumCoinConfig } from "../../types";
import { checkRecipientRestrictions } from "./pltRecipientRestrictions";

// Only the wire is mocked. Every layer above it — the cached readers, the entry
// lookup, the chain rule and the error mapping — runs for real, because the
// per-layer suites each mock the layer below and so none of them proves the
// chain composes.
jest.mock("../../network/proxyClient", () => ({
  getAccountBalance: jest.fn(),
  getPltTokenInfo: jest.fn(),
}));

const { getAccountBalance, getPltTokenInfo } = jest.requireMock("../../network/proxyClient");

const config = {} as ConcordiumCoinConfig;
const currencyId = "concordium_testnet";

// The readers cache on `${currencyId}:${token}` and `${currencyId}:${address}`,
// so each case needs its own pair rather than a cache reset it cannot reach.
let unique = 0;
const nextIds = () => {
  unique += 1;
  return { tokenId: `TOK${unique}`, recipient: `address-${unique}` };
};

const check = (over: { tokenId: string; recipient: string }) =>
  checkRecipientRestrictions({ config, currencyId, ticker: "TOK", ...over });

/** Shapes the proxy responses the way testnet actually returns them. */
const givenChain = ({
  moduleState,
  accountTokens,
  accountExists = true,
  tokenId,
}: {
  moduleState: unknown;
  accountTokens?: unknown[];
  accountExists?: boolean;
  tokenId: string;
}) => {
  getPltTokenInfo.mockResolvedValue({ tokenId, tokenState: { moduleState } });
  getAccountBalance.mockResolvedValue(
    accountExists ? { finalizedBalance: { accountAmount: "1", accountTokens } } : {},
  );
};

const entryFor = (tokenId: string, state?: unknown) => ({
  token: { tokenId, tokenState: { moduleState: {} } },
  tokenAccountState: { balance: { value: "500", decimals: 6 }, ...(state ? { state } : {}) },
});

beforeEach(() => jest.clearAllMocks());

describe("checkRecipientRestrictions, composed down to the wire", () => {
  it("rejects an allow-list token whose recipient holds no entry", async () => {
    const ids = nextIds();
    givenChain({ moduleState: { allowList: true }, accountTokens: [], tokenId: ids.tokenId });

    await expect(check(ids)).resolves.toBeInstanceOf(ConcordiumRecipientNotAllowed);
  });

  it("rejects a deny-list token whose recipient is on the list", async () => {
    const ids = nextIds();
    givenChain({
      moduleState: { denyList: true },
      accountTokens: [entryFor(ids.tokenId, { denyList: true })],
      tokenId: ids.tokenId,
    });

    await expect(check(ids)).resolves.toBeInstanceOf(ConcordiumRecipientDenied);
  });

  it("allows an approved recipient on an allow-list token", async () => {
    const ids = nextIds();
    givenChain({
      moduleState: { allowList: true },
      accountTokens: [entryFor(ids.tokenId, { allowList: true })],
      tokenId: ids.tokenId,
    });

    await expect(check(ids)).resolves.toBeUndefined();
  });

  it("never touches the recipient for a token declaring neither list", async () => {
    const ids = nextIds();
    givenChain({ moduleState: { name: "Unrestricted" }, tokenId: ids.tokenId });

    await expect(check(ids)).resolves.toBeUndefined();
    expect(getAccountBalance).not.toHaveBeenCalled();
  });

  it("reports an address the chain does not know", async () => {
    const ids = nextIds();
    givenChain({ moduleState: { allowList: true }, accountExists: false, tokenId: ids.tokenId });

    await expect(check(ids)).resolves.toBeInstanceOf(ConcordiumRecipientNotFound);
  });

  it("blocks when the module state arrives as undecodable hex", async () => {
    const ids = nextIds();
    givenChain({ moduleState: "a1696a6c6c6f774c697374f5", tokenId: ids.tokenId });

    await expect(check(ids)).resolves.toBeInstanceOf(ConcordiumRecipientRestrictionsUnverified);
  });

  it("blocks, rather than throwing, when an entry is malformed", async () => {
    const ids = nextIds();
    givenChain({
      moduleState: { allowList: true },
      accountTokens: [null],
      tokenId: ids.tokenId,
    });

    await expect(check(ids)).resolves.toBeInstanceOf(ConcordiumRecipientRestrictionsUnverified);
  });

  it("blocks a deny-list token whose recipient entry carries no balance", async () => {
    const ids = nextIds();
    givenChain({
      moduleState: { denyList: true },
      accountTokens: [
        { token: { tokenId: ids.tokenId, tokenState: { moduleState: {} } }, tokenAccountState: {} },
      ],
      tokenId: ids.tokenId,
    });

    await expect(check(ids)).resolves.toBeInstanceOf(ConcordiumRecipientRestrictionsUnverified);
  });

  it("blocks when the proxy is unreachable", async () => {
    const ids = nextIds();
    getPltTokenInfo.mockRejectedValue(new Error("ECONNREFUSED"));

    await expect(check(ids)).resolves.toBeInstanceOf(ConcordiumRecipientRestrictionsUnverified);
  });
});
