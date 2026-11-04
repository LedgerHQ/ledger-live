import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { getCurrencyConfiguration } from "../../config";
import { cardanoConfig } from "./config";

const CARDANO_API_ENDPOINT = "https://cardano.coin.ledger.com/api";
const CARDANO_TESTNET_API_ENDPOINT = "https://ledger-preprod.cardanoscan.io/api";

describe("cardanoConfig", () => {
  let savedConfig: typeof LiveConfig.instance.config;
  let savedProvider: typeof LiveConfig.instance.provider;

  beforeEach(() => {
    savedConfig = LiveConfig.instance.config;
    savedProvider = LiveConfig.instance.provider;
    LiveConfig.setConfig(cardanoConfig);
    LiveConfig.instance.provider = undefined;
  });

  afterEach(() => {
    LiveConfig.setConfig(savedConfig);
    LiveConfig.instance.provider = savedProvider;
  });

  it("should provide API endpoint defaults for both Cardano networks", () => {
    expect(getCurrencyConfiguration("cardano").infra).toEqual({
      CARDANO_API_ENDPOINT,
    });
    expect(getCurrencyConfiguration("cardano_testnet").infra).toEqual({
      CARDANO_API_ENDPOINT: CARDANO_TESTNET_API_ENDPOINT,
    });
  });

  it("should use the remote API endpoint when supplied", () => {
    LiveConfig.setProvider({
      getValueByKey: () => ({ infra: { CARDANO_API_ENDPOINT: "https://cardano.test/api" } }),
    });

    expect(getCurrencyConfiguration("cardano").infra).toEqual({
      CARDANO_API_ENDPOINT: "https://cardano.test/api",
    });
  });
});
