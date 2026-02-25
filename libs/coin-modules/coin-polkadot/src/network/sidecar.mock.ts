import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import {
  fixtureChainSpec,
  fixtureStakingProgress,
  fixtureTxMaterialWithMetadata,
} from "./sidecar.fixture";

export const SIDECAR_BASE_URL_TEST = "https://polkadot-asset-hub-sidecar.coin.ledger.com";

const handlers = [
  http.get(`${SIDECAR_BASE_URL_TEST}/accounts/:addr/balance-info`, () => {
    return HttpResponse.json({});
  }),
  http.get(`${SIDECAR_BASE_URL_TEST}/accounts/:addr/nominations`, () => {
    return HttpResponse.json({
      targets: [
        {
          address: "",
          value: 0,
          status: null,
        },
      ],
    });
  }),
  http.get(`${SIDECAR_BASE_URL_TEST}/pallets/staking/storage/ledger`, () => {
    return HttpResponse.json({});
  }),
  http.get(`${SIDECAR_BASE_URL_TEST}/pallets/staking/storage/bonded`, () => {
    return HttpResponse.json({});
  }),
  http.get(`${SIDECAR_BASE_URL_TEST}/transaction/material`, () =>
    HttpResponse.json(fixtureTxMaterialWithMetadata),
  ),
  http.get(`${SIDECAR_BASE_URL_TEST}/runtime/spec`, () => HttpResponse.json(fixtureChainSpec)),
  http.post(`${SIDECAR_BASE_URL_TEST}/transaction/fee-estimate`, () => HttpResponse.json({})),
  http.post(`${SIDECAR_BASE_URL_TEST}/transaction/metadata-blob`, () =>
    HttpResponse.json({
      at: { hash: "0xabc", height: "12345" },
      metadataHash: "0x1234",
      metadataBlob: "0xdeadbeef",
      specVersion: "1002000",
      specName: "polkadot",
      base58Prefix: "0",
      decimals: "10",
      tokenSymbol: "DOT",
    }),
  ),
  http.get(`${SIDECAR_BASE_URL_TEST}/pallets/staking/progress`, () =>
    HttpResponse.json(fixtureStakingProgress),
  ),
];

const mockServer = setupServer(...handlers);

export default mockServer;
