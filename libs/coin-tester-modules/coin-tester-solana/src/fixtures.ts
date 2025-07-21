import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
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
export const SOLANA_VIRTUAL: TokenCurrency = {
  type: "TokenCurrency",
  id: "solana/spl/3iql8bfs2ve7mww4ehaqqhasbmrncrpxizwat2zfyr9y",
  name: "Virtual Protocol",
  ticker: "VIRTUAL",
  units: [{ name: "VIRTUAL", code: "VIRTUAL", magnitude: 9 }],
  contractAddress: "3iQL8BFS2vE7mww4ehAqQHAsbmRNCrPxizWAT2Zfyr9y",
  parentCurrency: SOLANA,
  tokenType: "spl",
};
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

      if (url.searchParams.get("target_device") !== "nanox") {
        return HttpResponse.json([]);
      }

      if (
        url.searchParams.get("public_key_usage") === "trusted_name" &&
        url.searchParams.get("public_key_id") === "domain_metadata_key"
      ) {
        return HttpResponse.json([
          {
            descriptor: {
              data: "01010102010235010236010110040208000013020002140101200c747275737465645f6e616d65300200073101043201213401013321036a94e7a42cd0c33fdf440c8e2ab2542cefbe5db7aa0b93a9fc814b9acfa75eb4",
              signatures: {
                prod: "3044022065c969de8e3f0cc0a0f462777f68235e97ea2b3355fa63836541fa682dfc5a4b02206c8b61fe688deabde2660259afa40c38a6254b03240fa7157df84fa490c934f6",
              },
            },
          },
        ]);
      }

      if (
        url.searchParams.get("public_key_usage") === "coin_meta" &&
        url.searchParams.get("public_key_id") === "token_metadata_key"
      ) {
        return HttpResponse.json([
          {
            descriptor: {
              data: "01010102010235010236010110040208000013020002140101200e746f6b656e5f6d657461646174613002000e310108320121340101332103f530b026fc8acecbe4594e8b185d31157814f5e73d474180c801a4ca857ea37b",
              signatures: {
                prod: "3044022028ffb8efb8f54e5d7f6c25091074ca21ba0284fd88db00e1ed27c664dccfc4fd02200cb264a0b301d7bb4709c5b59cc8225359551c77cca43d99945ff646db5d6507",
              },
            },
          },
        ]);
      }
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
          url.searchParams.get("challenge") === "0x523ddeb5"
            ? "010103020102700106710106202c4348524b57323557785367326e467178754c575332366e6552634e6e79667752426d4a6e4e6d38596e776556230165222c486a363977527a6b72467566314e627934797a5045464864736d51644d6f56596a76444b5a534c6a5a464570732c3761746746384b516f34774a7244354154475837743156327a5676796b504a6246664e6556663169634676311204523ddeb513010714010115473045022034c0808c1563d6f28f84a473e03cb7cd5b5d5183a495e4501789fa361c5cce54022100a8274fce5103af61309b87b1a953a26b5991d5ae4a541d97ad7b51d7922c695f"
            : "invalid challenge";
        return HttpResponse.json({
          signedDescriptor,
        });
      },
    ),
    http.get(
      "https://nft.api.live.ledger.com/v2/solana/owner/2mmXJMyMm6XpL2hjZ3gQcDKyq4zBXoTETYTmVi8yzkgx",
      ({ request }) => {
        const url = new URL(request.url);
        const signedDescriptor =
          url.searchParams.get("challenge") === "0x3c905a79"
            ? "010103020102700106710106202c326d6d584a4d794d6d3658704c32686a5a33675163444b7971347a42586f54455459546d566938797a6b6778230165222c486a363977527a6b72467566314e627934797a5045464864736d51644d6f56596a76444b5a534c6a5a464570732c3369514c38424653327645376d7777346568417151484173626d524e43725078697a574154325a667972397912043c905a7913010714010115473045022100ec10ec22cd278cb26cce165b4988976202fad331ba006c5d57bfb9d4b5cd262e02200f8a612a351e6d371f7e81eb489a04467ad64205d49ff32b6273ddfa0090a037"
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
          url.searchParams.get("challenge") === "0x00f04d01"
            ? "010103020102700106710106202c4348524b57323557785367326e467178754c575332366e6552634e6e79667752426d4a6e4e6d38596e776556230165222c486a363977527a6b72467566314e627934797a5045464864736d51644d6f56596a76444b5a534c6a5a464570732c3761746746384b516f34774a7244354154475837743156327a5676796b504a6246664e655666316963467631120400f04d011301071401011546304402203a79abe8991286a1d9181414f88281ddcc088832c375e914f6bd4b7563b2d57102206d30bcabf267bc75fa16d5029fa60aa6dbf27bec69a9ed8d82772add344fe772"
            : "invalid challenge";
        return HttpResponse.json({
          signedDescriptor,
        });
      },
    ),
    http.get(
      "https://nft.api.live.ledger.com/v2/solana/computed-token-account/Hj69wRzkrFuf1Nby4yzPEFHdsmQdMoVYjvDKZSLjZFEp/3iQL8BFS2vE7mww4ehAqQHAsbmRNCrPxizWAT2Zfyr9y",
      ({ request }) => {
        const url = new URL(request.url);
        const signedDescriptor =
          url.searchParams.get("challenge") === "0x5c9dd1f4"
            ? "010103020102700106710106202c326d6d584a4d794d6d3658704c32686a5a33675163444b7971347a42586f54455459546d566938797a6b6778230165222c486a363977527a6b72467566314e627934797a5045464864736d51644d6f56596a76444b5a534c6a5a464570732c3369514c38424653327645376d7777346568417151484173626d524e43725078697a574154325a667972397912045c9dd1f41301071401011547304502201e477590350a97db3924f7ce88c49a6e1bb33cfe3dc22905b3ef39d0f9445961022100fa7b0ed5b34adbdc61422168268d9dc73fad8083ce0ee00e1195f6a6fedf3e2a"
            : "invalid challenge";
        return HttpResponse.json({
          signedDescriptor,
        });
      },
    ),
    http.get("https://earn.api.live.ledger.com/v0/network/solana/validator-details", () =>
      HttpResponse.json([]),
    ),
    http.get("https://crypto-assets-service.api.ledger.com/v1/tokens", ({ request }) => {
      const url = new URL(request.url);
      switch (url.searchParams.get("id")) {
        case "solana/spl/epjfwdd5aufqssqem2qn1xzybapc8g4weggkzwytdt1v": // USDC
          return HttpResponse.json([
            {
              descriptor: {
                data: "0101900201010304800001f50406536f6c616e610504555344430601060733100100112c45506a465764643541756671535371654d32714e31787a7962617043384734774547476b5a777954447431761200",
                signatures: {
                  prod: "3044022072409f98d63ffc8c2f15c1fcceb79bd7733490b4745c40557cb67a4bcf681cf7022014da5ab63b6f627eac9a89388fa9aa4d0195ad0d4fa5786a4fb0e516400eb423",
                },
              },
              descriptor_exchange_app: { signatures: {} },
            },
          ]);
        case "solana/spl/7atgf8kqo4wjrd5atgx7t1v2zvvykpjbffnevf1icfv1": // CWIF
          return HttpResponse.json([
            {
              descriptor: {
                data: "0101900201010304800001f50406536f6c616e610504435749460601020734100101112c3761746746384b516f34774a7244354154475837743156327a5676796b504a6246664e655666316963467631120101",
                signatures: {
                  prod: "3045022100929e824eab136768313d2358ef3be21144b60a4353c1582e226516ce73e8dd8c02203d70ef7c952d7bf25c009041b089bfacfffcdabe0ad9f2352372f666a1c70e79",
                },
              },
              descriptor_exchange_app: { signatures: {} },
            },
          ]);
        case "solana/spl/3iql8bfs2ve7mww4ehaqqhasbmrncrpxizwat2zfyr9y": // VIRTUAL
          return HttpResponse.json([
            {
              descriptor: {
                data: "0101900201010304800001f50406536f6c616e6105075649525455414c0601090733100100112c3369514c38424653327645376d7777346568417151484173626d524e43725078697a574154325a66797239791200",
                signatures: {
                  prod: "304402205e5ab58e4ad414c7641effdab231e30d4e6aab5a7d99f7d87ef4932612f0bf56022014c71b9049022ed020107b86d6d0efe06e157e30d8487dd71970fa7e42d6a1bf",
                },
              },
              descriptor_exchange_app: { signatures: {} },
            },
          ]);
      }
      return HttpResponse.json([]);
    }),
  );
  mockServer.listen({
    onUnhandledRequest: request => {
      const hostname = new URL(request.url).hostname;
      if (hostname === "localhost") return;
      throw new Error("Unhandled request");
    },
  });
}
