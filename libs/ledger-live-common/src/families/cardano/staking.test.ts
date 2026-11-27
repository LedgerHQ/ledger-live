import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { LEDGER_VALIDATORS } from "@ledgerhq/coin-cardano/tuning";
import { cardanoConfig } from "./config";
import { cardanoDefaults } from "@ledgerhq/coin-cardano/config";
import { getLedgerPoolIds, getPoolPageSize } from "./staking";

describe("getLedgerPoolIds", () => {
  const cardano = getCryptoCurrencyById("cardano");
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

  it("answers the Ledger pools without an override", () => {
    expect(getLedgerPoolIds(cardano)).toEqual(LEDGER_VALIDATORS);
  });

  it("answers the pool ids of the remote config, not merged with the Ledger pools", () => {
    LiveConfig.setProvider({
      getValueByKey: () => ({ staking: { ledgerValidators: ["pool"] } }),
    });

    expect(getLedgerPoolIds(cardano)).toEqual(["pool"]);
  });

  it("answers the Ledger pools when the remote list is invalid", () => {
    LiveConfig.setProvider({
      getValueByKey: () => ({ staking: { ledgerValidators: [] } }),
    });

    expect(getLedgerPoolIds(cardano)).toEqual(LEDGER_VALIDATORS);
  });
});

describe("getPoolPageSize", () => {
  const cardano = getCryptoCurrencyById("cardano");
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

  it("answers the configured page size", () => {
    LiveConfig.setProvider({ getValueByKey: () => ({ validators: { batchSize: 25 } }) });

    expect(getPoolPageSize(cardano)).toBe(25);
  });

  it("answers the registered page size when the remote one is invalid", () => {
    LiveConfig.setProvider({ getValueByKey: () => ({ validators: { batchSize: 0 } }) });

    expect(getPoolPageSize(cardano)).toBe(cardanoDefaults.cardano.validators.batchSize);
  });
});
