import { fetchAccountTokens, fetchPltModuleState } from "../../network/pltRecipient";
import {
  ConcordiumRecipientDenied,
  ConcordiumRecipientNotAllowed,
  ConcordiumRecipientNotFound,
  ConcordiumRecipientRestrictionsUnverified,
} from "../../types/errors";
import type {
  ConcordiumCoinConfig,
  PltAccountModuleState,
  PltAccountToken,
  PltEncodedState,
  PltModuleState,
} from "../../types";
import { checkRecipientRestrictions } from "./pltRecipientRestrictions";

jest.mock("../../network/pltRecipient", () => ({
  fetchPltModuleState: jest.fn(),
  fetchAccountTokens: jest.fn(),
}));

const mockedModuleState = jest.mocked(fetchPltModuleState);
const mockedAccountTokens = jest.mocked(fetchAccountTokens);

const TOKEN_ID = "UPEU";
const TICKER = "UPEU";
const RECIPIENT = "4fWTMJSAymJoFeTbohJzwejT6Wzh1dAa2BtnbDicgjQrc94TgW";

const config = { proxyUrl: "https://proxy.test" } as ConcordiumCoinConfig;

const check = () =>
  checkRecipientRestrictions({
    config,
    currencyId: "concordium_testnet",
    recipient: RECIPIENT,
    tokenId: TOKEN_ID,
    ticker: TICKER,
  });

/** The recipient holds the token, with the given per-account list state. */
function holding(state?: PltEncodedState<PltAccountModuleState>): PltAccountToken[] {
  return [
    {
      token: {
        tokenId: TOKEN_ID,
        tokenState: {
          tokenModuleRef: "ref",
          decimals: 6,
          totalSupply: { value: "1000", decimals: 6 },
          moduleState: {},
        },
      },
      tokenAccountState: {
        balance: { value: "500", decimals: 6 },
        ...(state === undefined ? {} : { state }),
      },
    },
  ];
}

const givenToken = (moduleState: PltModuleState | undefined) =>
  mockedModuleState.mockResolvedValue(moduleState);

const givenRecipient = (entries: PltAccountToken[]) =>
  mockedAccountTokens.mockResolvedValue({ status: "readable", entries });

beforeEach(() => {
  jest.resetAllMocks();
});

describe("checkRecipientRestrictions", () => {
  it("rejects an allow-list token when the recipient has no entry at all", async () => {
    givenToken({ allowList: true });
    givenRecipient([]);

    await expect(check()).resolves.toBeInstanceOf(ConcordiumRecipientNotAllowed);
  });

  it("rejects an allow-list token when the recipient is present but not approved", async () => {
    givenToken({ allowList: true });
    givenRecipient(holding({ allowList: false }));

    await expect(check()).resolves.toBeInstanceOf(ConcordiumRecipientNotAllowed);
  });

  it("rejects a deny-list token when the recipient is on the list", async () => {
    givenToken({ denyList: true });
    givenRecipient(holding({ denyList: true }));

    await expect(check()).resolves.toBeInstanceOf(ConcordiumRecipientDenied);
  });

  it("allows a deny-list token when the recipient is not on the list", async () => {
    givenToken({ denyList: true });
    givenRecipient(holding({ denyList: false }));

    await expect(check()).resolves.toBeUndefined();
  });

  it("allows an allow-list token when the recipient is approved", async () => {
    givenToken({ allowList: true });
    givenRecipient(holding({ allowList: true }));

    await expect(check()).resolves.toBeUndefined();
  });

  describe("a token declaring neither list", () => {
    it("never blocks", async () => {
      givenToken({ name: "Unrestricted" });

      await expect(check()).resolves.toBeUndefined();
    });

    // The answer cannot depend on the recipient, so spending a request on it
    // would only publish the address to the proxy for nothing.
    it("does not look the recipient up at all", async () => {
      givenToken({ name: "Unrestricted" });

      await check();

      expect(mockedAccountTokens).not.toHaveBeenCalled();
    });
  });

  describe("rejects as unverifiable rather than passing as allowed", () => {
    it("when the token state could not be read", async () => {
      givenToken(undefined);

      await expect(check()).resolves.toBeInstanceOf(ConcordiumRecipientRestrictionsUnverified);
      expect(mockedAccountTokens).not.toHaveBeenCalled();
    });

    it("when the recipient's token list could not be read", async () => {
      givenToken({ denyList: true });
      mockedAccountTokens.mockResolvedValue({ status: "unreadable" });

      await expect(check()).resolves.toBeInstanceOf(ConcordiumRecipientRestrictionsUnverified);
    });

    it("when the account state does not decode", async () => {
      givenToken({ allowList: true });
      givenRecipient(holding("a1"));

      await expect(check()).resolves.toBeInstanceOf(ConcordiumRecipientRestrictionsUnverified);
    });

    it("when the token lookup fails", async () => {
      mockedModuleState.mockRejectedValue(new Error("proxy unreachable"));

      await expect(check()).resolves.toBeInstanceOf(ConcordiumRecipientRestrictionsUnverified);
    });

    it("when the recipient lookup fails", async () => {
      givenToken({ allowList: true });
      mockedAccountTokens.mockRejectedValue(new Error("proxy unreachable"));

      await expect(check()).resolves.toBeInstanceOf(ConcordiumRecipientRestrictionsUnverified);
    });
  });

  // A rejection would reach `useBridgeRecipientValidation`, which catches and
  // reports no error at all — the transfer would sail past the check.
  it("never rejects, whatever the lookups do", async () => {
    mockedModuleState.mockRejectedValue(new Error("proxy unreachable"));

    await expect(check()).resolves.toBeInstanceOf(ConcordiumRecipientRestrictionsUnverified);
  });

  it("reports an address that does not exist on chain as not found", async () => {
    givenToken({ allowList: true });
    mockedAccountTokens.mockResolvedValue({ status: "absent" });

    await expect(check()).resolves.toBeInstanceOf(ConcordiumRecipientNotFound);
  });

  it("carries the ticker, which every message interpolates", async () => {
    givenToken({ allowList: true });
    givenRecipient([]);

    await expect(check()).resolves.toMatchObject({ ticker: TICKER });
  });

  it("ignores an entry for a different token on the same account", async () => {
    givenToken({ allowList: true });
    const otherToken = holding({ allowList: true });
    otherToken[0].token.tokenId = "SOMETHING_ELSE";
    givenRecipient(otherToken);

    await expect(check()).resolves.toBeInstanceOf(ConcordiumRecipientNotAllowed);
  });
});
