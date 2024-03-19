import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import { fixtureChainSpec, fixtureTxMaterialWithMetadata } from "./sidecar.fixture";

const handlers = [
  http.get("https://polkadot-sidecar.coin.ledger.com/accounts/:addr/balance-info", () => {
    return HttpResponse.json({});
  }),
  http.get("https://polkadot-sidecar.coin.ledger.com/accounts/:addr/nominations", () => {
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
  http.get("https://polkadot-sidecar.coin.ledger.com/pallets/staking/storage/ledger", () => {
    return HttpResponse.json({});
  }),
  http.get("https://polkadot-sidecar.coin.ledger.com/pallets/staking/storage/bonded", () => {
    return HttpResponse.json({});
  }),
  http.get("https://polkadot-sidecar.coin.ledger.com/transaction/material", () =>
    HttpResponse.json(fixtureTxMaterialWithMetadata),
  ),
  http.get("https://polkadot-sidecar.coin.ledger.com/runtime/spec", () =>
    HttpResponse.json(fixtureChainSpec),
  ),
  http.post("https://polkadot-sidecar.coin.ledger.com/transaction/fee-estimate", () =>
    HttpResponse.json({}),
  ),
];

const mockServer = setupServer(...handlers);

export default mockServer;
