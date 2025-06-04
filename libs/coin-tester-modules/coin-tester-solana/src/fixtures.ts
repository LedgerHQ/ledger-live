import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { decodeAccountId } from "@ledgerhq/coin-framework/account";
import { getDerivationScheme, runDerivationScheme } from "@ledgerhq/coin-framework/derivation";
import { TokenAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { SolanaAccount } from "@ledgerhq/coin-solana/types";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { getTokenById } from "@ledgerhq/cryptoassets/tokens";
import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";

export const RECIPIENT = "Hj69wRzkrFuf1Nby4yzPEFHdsmQdMoVYjvDKZSLjZFEp";
export const SOLANA = getCryptoCurrencyById("solana");
export const SOLANA_USDC = getTokenById("solana/spl/epjfwdd5aufqssqem2qn1xzybapc8g4weggkzwytdt1v");
export const SOLANA_CWIF = getTokenById("solana/spl/7atgf8kqo4wjrd5atgx7t1v2zvvykpjbffnevf1icfv1");
export const WITHDRAWABLE_AMOUNT = 2e9;

export const makeAccount = (
  address: string,
  currency: CryptoCurrency,
  subAccounts: TokenAccount[] = [],
): SolanaAccount => {
  const id = `js:2:${currency.id}:${address}:solanaSub`;
  const { derivationMode, xpubOrAddress } = decodeAccountId(id);
  const scheme = getDerivationScheme({
    derivationMode,
    currency,
  });

  const index = 0;
  const freshAddressPath = runDerivationScheme(scheme, currency, {
    account: index,
    node: 0,
    address: 0,
  });

  return {
    type: "Account",
    id,
    xpub: xpubOrAddress,
    subAccounts,
    seedIdentifier: xpubOrAddress,
    used: true,
    swapHistory: [],
    derivationMode,
    currency,
    index,
    nfts: [],
    freshAddress: xpubOrAddress,
    freshAddressPath,
    creationDate: new Date(),
    lastSyncDate: new Date(0),
    blockHeight: 0,
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    balanceHistoryCache: {
      HOUR: {
        latestDate: null,
        balances: [],
      },
      DAY: {
        latestDate: null,
        balances: [],
      },
      WEEK: {
        latestDate: null,
        balances: [],
      },
    },
    solanaResources: { stakes: [], unstakeReserve: new BigNumber(0) },
  };
};

export function initMSW() {
  const mockServer = setupServer(
    http.get("https://crypto-assets-service.api.ledger.com/v1/certificates", ({ request }) => {
      const url = new URL(request.url);
      return HttpResponse.json(
        url.searchParams.get("target_device") === "nanox"
          ? [
              {
                descriptor: {
                  data: "01010102010235010236010110040208000013020002140101200c747275737465645f6e616d65300200073101043201213401013321036a94e7a42cd0c33fdf440c8e2ab2542cefbe5db7aa0b93a9fc814b9acfa75eb4",
                  signatures: {
                    test: "304402205caeb7806b4d07f9de76cc43fbdea235a87845f5a0bb5273511237492b05712802204c885133c97d7497654dd808433543ac15efa4bd1de7bace536e8d13068fc3b1",
                  },
                },
              },
            ]
          : [],
      );
    }),
    http.get(
      "https://nft.api.live.ledger.com/v2/solana/owner/H6echhXDiRfCjSgwz5VNiF7g2vJYT4wG9zg7tQgKYasD",
      ({ request }) => {
        const url = new URL(request.url);
        const signedDescriptor =
          url.searchParams.get("challenge") === "0x535ee2e9"
            ? "010103020102700106710106202c4836656368685844695266436a5367777a35564e6946376732764a5954347747397a67377451674b59617344230165222c486a363977527a6b72467566314e627934797a5045464864736d51644d6f56596a76444b5a534c6a5a464570732c45506a465764643541756671535371654d32714e31787a7962617043384734774547476b5a777954447431761204535ee2e91301071401011548304602210091c080c2e7fcfd172dbcfa28a67ff879aaae8715014db12f9488cb42cdba94ac022100c0844c8979cd773a1b5404c3b07a382c2b5d9a369c5c18050b308a683e7b7cde"
            : "invalid challenge";
        return HttpResponse.json({
          signedDescriptor,
        });
      },
    ),
    http.get(
      "https://nft.api.live.ledger.com/v2/solana/owner/CHRKW25WxSg2nFqxuLWS26neRcNnyfwRBmJnNm8YnweV",
      ({ request }) => {
        const url = new URL(request.url);
        const signedDescriptor =
          url.searchParams.get("challenge") === "0xcf678b10"
            ? "010103020102700106710106202c4348524b57323557785367326e467178754c575332366e6552634e6e79667752426d4a6e4e6d38596e776556230165222c486a363977527a6b72467566314e627934797a5045464864736d51644d6f56596a76444b5a534c6a5a464570732c3761746746384b516f34774a7244354154475837743156327a5676796b504a6246664e6556663169634676311204cf678b1013010714010115483046022100958c0f79e16cad4b00ce30c8f47e468cac2ae1a41ae61efe3bbc4f358375df4002210089a1b83d9a61719d47f32e5727762dd3bfadd67e8236c7f46e6265c825f7a9a7"
            : "invalid challenge";
        return HttpResponse.json({
          signedDescriptor,
        });
      },
    ),
    http.get(
      "https://nft.api.live.ledger.com/v2/solana/computed-token-account/Hj69wRzkrFuf1Nby4yzPEFHdsmQdMoVYjvDKZSLjZFEp/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      ({ request }) => {
        const url = new URL(request.url);
        const signedDescriptor =
          url.searchParams.get("challenge") === "0xb2d47008"
            ? "010103020102700106710106202c4836656368685844695266436a5367777a35564e6946376732764a5954347747397a67377451674b59617344230165222c486a363977527a6b72467566314e627934797a5045464864736d51644d6f56596a76444b5a534c6a5a464570732c45506a465764643541756671535371654d32714e31787a7962617043384734774547476b5a777954447431761204b2d47008130107140101154730450220351650694b4086fd9d39c26f8a2cab31ea210dc066849c10e43692ee9b167f08022100c75e2a4dce53dd4a49e0337afda63c9cca54a2e074927687c7d14626ee8c5803"
            : "invalid challenge";
        return HttpResponse.json({
          signedDescriptor,
        });
      },
    ),
    http.get(
      "https://nft.api.live.ledger.com/v2/solana/computed-token-account/Hj69wRzkrFuf1Nby4yzPEFHdsmQdMoVYjvDKZSLjZFEp/7atgF8KQo4wJrD5ATGX7t1V2zVvykPJbFfNeVf1icFv1",
      ({ request }) => {
        const url = new URL(request.url);
        const signedDescriptor =
          url.searchParams.get("challenge") === "0xba6816cd"
            ? "010103020102700106710106202c4348524b57323557785367326e467178754c575332366e6552634e6e79667752426d4a6e4e6d38596e776556230165222c486a363977527a6b72467566314e627934797a5045464864736d51644d6f56596a76444b5a534c6a5a464570732c3761746746384b516f34774a7244354154475837743156327a5676796b504a6246664e6556663169634676311204ba6816cd13010714010115463044022076b8fbc7123167955ec273283a75e0db73e1b7f95d901afb240dde2bdd4fc0c7022061537bfc370235f59e1effebdd5d0d373c761caaca85fc3b20b64b194d34e7d4"
            : "invalid challenge";
        return HttpResponse.json({
          signedDescriptor,
        });
      },
    ),
    http.get("https://earn.api.live.ledger.com/v0/network/solana/validator-details", () =>
      HttpResponse.json([]),
    ),
    http.get("https://crypto-assets-service.api.ledger.com/v1/tokens", () => HttpResponse.json([])),
  );
  mockServer.listen({
    onUnhandledRequest: request => {
      const hostname = new URL(request.url).hostname;
      if (hostname === "localhost") return;
      throw new Error("Unhandled request");
    },
  });
}
