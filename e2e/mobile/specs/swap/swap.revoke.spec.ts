import { Provider } from "@ledgerhq/live-common/e2e/enum/Provider";
import { setEnv } from "@ledgerhq/live-env";
import { beforeAllFunctionSwap } from "./swap.setup";

// NOTE: QAA-615 spike: validate the CLI revoke hook resets allowance to zero on mobile.
setEnv("DISABLE_TRANSACTION_BROADCAST", true);

const fromAccount = TokenAccount.ETH_USDT_1;
const provider = Provider.OKX;
const minAmount = "10";
const tags = [
  "@NanoSP",
  "@LNS",
  "@NanoX",
  "@Stax",
  "@Flex",
  "@NanoGen5",
  "@ethereum",
  "@family-evm",
];

describe("Swap - Revoke token approval", () => {
  beforeAll(async () => {
    await app.speculos.setExchangeDependencies(fromAccount, fromAccount.parentAccount!);
    await beforeAllFunctionSwap({
      userdata: "skip-onboarding",
      speculosApp: provider.app,
      cliCommandsOnApp: [
        {
          app: fromAccount.currency.speculosApp,
          cmd: liveDataWithAddressCommand(fromAccount),
        },
      ],
    });
  });

  tags.forEach(tag => $Tag(tag));

  it(`Revoke - ${provider.uiName} ${fromAccount.currency.name} allowance returns to zero`, async () => {
    await app.swap.ensureTokenApproval(fromAccount, provider, minAmount);
    await app.swap.revokeTokenApproval(fromAccount, provider);

    const remaining = await isTokenAllowanceSufficientCommand(
      fromAccount,
      provider.contractAddress!,
      "0.000001",
    );
    expect(remaining).toBe(0);
  });
});
