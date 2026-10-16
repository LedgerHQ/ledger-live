import BigNumber from "bignumber.js";
import { createSingleAddressAccountModule } from "@ledgerhq/account-module-single-address";
import { NotEnoughBalance } from "@ledgerhq/coin-module-framework/errors";
import { createPortfolioServiceClient } from "@ledgerhq/portfolio-module-portfolio-service";
import type { Account } from "@ledgerhq/types-live";
import { getCoinModuleApi } from "../api";
import { getBridgeApi } from "../bridge";
import { genericGetTransactionStatus } from "../getTransactionStatus";
import type { GenericTransaction } from "../types";
import {
  fakeCoinModule,
  liveOperation,
  mockLiveConfig,
  portfolioCoinConfig,
  ripple,
  RIPPLE_ACCOUNT_ID,
  rippleAccount,
  serviceStandIn,
  standInNetwork,
  type FakeCoinModule,
  type SpiedPortfolio,
} from "./portfolioFixtures";

jest.mock("../api", () => ({ getCoinModuleApi: jest.fn() }));
jest.mock("../bridge", () => ({ getBridgeApi: jest.fn() }));
jest.mock("@ledgerhq/portfolio-module-portfolio-service", () => ({
  createPortfolioServiceClient: jest.fn(),
}));

type Mode = "local" | "hybrid" | "remote";

/** The coin config of ripple: `undefined` keeps it on the legacy bridge. */
function configure(mode: Mode | undefined): void {
  mockLiveConfig({
    config_portfolio_service: { url: "https://portfolio.test", portfolioId: "wallet" },
    config_currency_ripple: mode ? portfolioCoinConfig(mode) : { status: { type: "active" } },
  });
}

/** What the coin module answers: a balance too low, its error pointing at the buy flow. */
const notEnoughBalance = () =>
  Object.assign(new NotEnoughBalance(), { links: ["ledgerlive://buy"] });

let coinModule: FakeCoinModule;
let serviceCoinModule: FakeCoinModule;
let service: SpiedPortfolio;

beforeEach(() => {
  jest.clearAllMocks();
  coinModule = fakeCoinModule({
    validateIntent: jest.fn(async () => ({
      errors: { amount: notEnoughBalance() },
      warnings: {},
      estimatedFees: 12n,
      amount: 100n,
      totalSpent: 112n,
    })),
  });
  serviceCoinModule = fakeCoinModule();
  service = serviceStandIn(
    "xrp",
    standInNetwork(
      ripple,
      serviceCoinModule,
      createSingleAddressAccountModule(serviceCoinModule as never),
      "static",
    ),
  );
  // The portfolio-service serves no validation.
  delete (service as Partial<SpiedPortfolio>).validateTransaction;
  (createPortfolioServiceClient as jest.Mock).mockReturnValue(service);
  (getCoinModuleApi as jest.Mock).mockResolvedValue(coinModule);
  (getBridgeApi as jest.Mock).mockResolvedValue({});
});

afterEach(() => jest.restoreAllMocks());

const account = (): Account =>
  rippleAccount({
    balance: new BigNumber(1_000),
    spendableBalance: new BigNumber(990),
    pendingOperations: [
      liveOperation({ type: "OUT", hash: "pending", value: new BigNumber(50), blockHeight: null }),
    ],
  });

const transaction = (): GenericTransaction => ({
  family: "xrp",
  amount: new BigNumber(100),
  recipient: "rRecipient",
  fees: new BigNumber(15),
  feesStrategy: "fast",
});

const status = () => genericGetTransactionStatus("ripple", "local")(account(), transaction());

describe("genericGetTransactionStatus on the portfolio layer", () => {
  it.each(["local", "hybrid"] as const)(
    "validates through the local side as the legacy path does (%s)",
    async mode => {
      configure(undefined);
      const legacy = await status();
      const [, legacyIntent, legacyBalances, legacyOptions] = coinModule.validateIntent.mock
        .calls[0] as unknown[];

      configure(mode);
      coinModule.validateIntent.mockClear();
      const served = await status();

      // The coin module gets the same intent, balances (pending spend locked) and fee options.
      expect(coinModule.validateIntent).toHaveBeenCalledTimes(1);
      const [, intent, balances, options] = coinModule.validateIntent.mock.calls[0] as unknown[];
      expect(intent).toEqual(legacyIntent);
      expect(balances).toEqual(legacyBalances);
      expect(options).toEqual(legacyOptions);
      // The same status: the error revived as its class, its buy link naming the account.
      expect(served).toEqual(legacy);
      expect(served.errors.amount).toBeInstanceOf(NotEnoughBalance);
      expect(served.errors.amount).toMatchObject({
        links: [`ledgerlive://buy?account=${encodeURIComponent(RIPPLE_ACCOUNT_ID)}`],
      });
      expect(served.estimatedFees).toEqual(new BigNumber(15));
      // A local write needs nothing from the service.
      expect(service.getPortfolio).not.toHaveBeenCalled();
    },
  );

  it("answers an unvalidated status in remote mode, the service serving no validation", async () => {
    configure("remote");
    await expect(status()).resolves.toEqual({
      errors: {},
      warnings: {},
      totalFees: undefined,
      estimatedFees: new BigNumber(15),
      amount: new BigNumber(100),
      totalSpent: new BigNumber(115),
    });
    expect(coinModule.validateIntent).not.toHaveBeenCalled();
    expect(serviceCoinModule.validateIntent).not.toHaveBeenCalled();
  });
});
