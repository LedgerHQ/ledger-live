# Creating an Onboarding Adapter for a New Currency

Create a new file `adapters/[currency-family].ts` and implement the following:

## Bridge Adapter

```typescript
import type { CurrencyBridge } from "@ledgerhq/coin-new/types";
import { currencyOnboardProgress, currencyOnboardResult } from "@ledgerhq/coin-new/types";
import { getCurrencyBridge } from "@ledgerhq/live-common/bridge/index";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { map } from "rxjs/operators";
import { OnboardingBridge, OnboardProgress, OnboardResult } from "../types";

function isCurrencyBridge(bridge: unknown): bridge is CurrencyBridge {
  if (!bridge || typeof bridge !== "object") {
    return false;
  }

  if (!("onboardAccount" in bridge)) {
    return false;
  }

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const bridgeWithProperty = bridge as { onboardAccount: unknown };
  return typeof bridgeWithProperty.onboardAccount === "function";
}

export function getCurrencyBridge(currency: CryptoCurrency): CurrencyBridge | null {
  const bridge = getCurrencyBridge(currency);
  if (!bridge) {
    return null;
  }

  if (isCurrencyBridge(bridge)) {
    return bridge;
  }
  return null;
}

export function createCurrencyOnboardingBridge(currencyBridge: CurrencyBridge): OnboardingBridge {
  return {
    onboardAccount: (currency, deviceId, creatableAccount) => {
      return currencyBridge.onboardAccount(currency, deviceId, creatableAccount).pipe(
        map(
          (
            data: currencyOnboardProgress | currencyOnboardResult,
          ): OnboardProgress | OnboardResult => {
            if ("status" in data) {
              return { status: data.status };
            }
            if ("account" in data) {
              return {
                account: data.account,
                metadata: {
                  /* currency-specific metadata */
                },
              };
            }
            throw new Error("Invalid currency onboarding result");
          },
        ),
      );
    },
  };
}
```

**Note:** Your currency's bridge should use `AccountOnboardStatus` from `@ledgerhq/types-live` for the status field.

## Configuration

```typescript
import { StepOnboardFooter, StepFinishFooter } from "../footers";
import StepOnboard from "../StepOnboard";
import StepFinish from "../StepFinish";
import TransactionConfirm from "../TransactionConfirm";
import { StepId, TranslationKeys, UrlConfig, OnboardingConfig } from "../types";

const currencyTranslationKeys: TranslationKeys = {
  title: "families.new.addAccount.onboard.title",
  reonboardTitle: "families.new.addAccount.reonboard.title",
  init: "families.new.addAccount.onboard.init",
  reonboardInit: "families.new.addAccount.reonboard.init",
  success: "families.new.addAccount.onboard.success",
  reonboardSuccess: "families.new.addAccount.reonboard.success",
  error: "families.new.addAccount.onboard.error",
  error429: "families.new.addAccount.onboard.error429",
  onboarded: "families.new.addAccount.onboard.onboarded",
  account: "families.new.addAccount.onboard.account",
  newAccount: "families.new.addAccount.onboard.newAccount",
  statusPrepare: "families.new.addAccount.onboard.status.prepare",
  statusSubmit: "families.new.addAccount.onboard.status.submit",
  statusDefault: "families.new.addAccount.onboard.status.default",
};

const currencyUrls: UrlConfig = {
  learnMore: urls.new.learnMore,
};

export const currencyOnboardingConfig: OnboardingConfig = {
  stepComponents: {
    [StepId.ONBOARD]: StepOnboard,
    [StepId.FINISH]: StepFinish,
  },
  footerComponents: {
    [StepId.ONBOARD]: StepOnboardFooter,
    [StepId.FINISH]: StepFinishFooter,
  },
  translationKeys: currencyTranslationKeys,
  urls: currencyUrls,
  stepFlow: [StepId.ONBOARD, StepId.FINISH],
  transactionConfirmComponent: TransactionConfirm,
};
```

## Registration

In `registry.ts`, add to the maps:

```typescript
import {
  currencyOnboardingConfig,
  getCurrencyBridge,
  createCurrencyOnboardingBridge,
} from "./adapters/new";
import type { CurrencyBridge } from "@ledgerhq/coin-new/types";

const onboardingConfigs: Record<string, OnboardingConfig> = {
  canton: cantonOnboardingConfig,
  new: currencyOnboardingConfig,
};

const onboardingBridgeResolvers: Record<
  string,
  (currency: CryptoCurrency) => OnboardingBridge | null
> = {
  canton: (currency: CryptoCurrency) => {
    /* ... */
  },
  new: (currency: CryptoCurrency) => {
    const bridge = getCurrencyBridge(currency);
    if (!bridge) {
      return null;
    }
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return createCurrencyOnboardingBridge(bridge as CurrencyBridge);
  },
};
```

## See Also

- `adapters/canton.ts` - Example implementation
- `registry.ts` - Registry implementation
- `types.ts` - Type definitions
