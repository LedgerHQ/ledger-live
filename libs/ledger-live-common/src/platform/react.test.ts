import { platformUrl } from "./react";
import { AppManifest } from "./types";

describe("platformUrl", () => {
  const appManifestUrl = "https://dapp-browser.apps.ledger.com/";
  const appManifest: AppManifest = {
    id: "1inch-lld",
    name: "1inch",
    private: true,
    url: appManifestUrl,
    homepageUrl: "https://1inch.io/",
    icon: "https://cdn.live.ledger.com/icons/platform/1inch.png",
    platform: "desktop",
    apiVersion: "^1.0.0 || ~0.0.1",
    manifestVersion: "1",
    branch: "stable",
    categories: ["swap", "defi"],
    currencies: ["ethereum"],
    content: {
      shortDescription: {
        en: "Exchange crypto via a Defi/DEX aggregator on Ethereum mainnet, BSC or Polygon",
      },
      description: {
        en: "Exchange crypto via a Defi/DEX aggregator on Ethereum mainnet, BSC or Polygon",
      },
    },
    permissions: [],
    domains: ["https://*"],
  };

  it("returns url to call", () => {
    // Given
    const dAppParams =
      '{ \
      "dappUrl": "https://app.1inch.io/?ledgerLive=true", \
      "nanoApp": "1inch", \
      "dappName": "1inch", \
      "networks": [ \
        { \
          "currency": "ethereum", \
          "chainID": 1, \
          "nodeURL": \
            "wss://eth-mainnet.ws.alchemyapi.io/v2/0fyudoTG94QWC0tEtfJViM9v2ZXJuij2", \
        }, \
        { \
          "currency"": "bsc", \
          "chainID": 56, \
          "nodeURL": "https://bsc-dataseed.binance.org/", \
        }, \
        { \
          "currency": "polygon", \
          "chainID": 137, \
          "nodeURL": \
            "https://polygon-mainnet.g.alchemy.com/v2/oPIxZM7kXsPVVY1Sk0kOQwkoIOpSu8PE", \
        }, \
      ], \
    }';
    appManifest.params = [dAppParams];
    const params = { background: "background", text: "text" };
    const inputs = { firstInput: "12", secondInput: "second" };

    // When
    const url: URL = platformUrl(appManifest, params, inputs);

    // Then
    const expectedUrl = new URL(
      appManifestUrl +
        "?firstInput=12&secondInput=second&backgroundColor=background&textColor=text"
    );
    expectedUrl.searchParams.set("params", JSON.stringify([dAppParams]));
    expect(url).toEqual(expectedUrl);
  });

  it("returns url to call with a dAppUrl given in parameter", () => {
    // Given
    const dAppUrlToCall = "https://embedded.paraswap.io/?ledgerLive=true";
    const dAppParams = {
      dappUrl: "https://app.1inch.io/?ledgerLive=true",
      nanoApp: "1inch",
      dappName: "1inch",
      networks: [
        {
          currency: "ethereum",
          chainID: 1,
          nodeURL:
            "wss://eth-mainnet.ws.alchemyapi.io/v2/0fyudoTG94QWC0tEtfJViM9v2ZXJuij2",
        },
        {
          currency: "bsc",
          chainID: 56,
          nodeURL: "https://bsc-dataseed.binance.org/",
        },
        {
          currency: "polygon",
          chainID: 137,
          nodeURL:
            "https://polygon-mainnet.g.alchemy.com/v2/oPIxZM7kXsPVVY1Sk0kOQwkoIOpSu8PE",
        },
      ],
    };
    appManifest.params = dAppParams;
    const params = { background: "background", text: "text" };
    const inputs = { firstInput: "12", secondInput: "second" };

    // When
    const url: URL = platformUrl(appManifest, params, inputs, dAppUrlToCall);

    // Then
    const expectedUrl = new URL(
      appManifestUrl +
        "?firstInput=12&secondInput=second&backgroundColor=background&textColor=text"
    );
    const expectedDAppParams = {
      ...dAppParams,
      dappUrl: dAppUrlToCall,
    };
    expectedUrl.searchParams.set("params", JSON.stringify(expectedDAppParams));
    expect(url).toEqual(expectedUrl);
  });
});
