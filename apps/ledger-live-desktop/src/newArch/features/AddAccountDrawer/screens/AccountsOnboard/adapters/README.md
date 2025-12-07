# Creating an Onboarding Adapter for a New Currency

Create a new file `adapters/[currency-family].ts` and implement the following:

## Bridge Adapter

```typescript
import type { YourCurrencyBridge } from "@ledgerhq/coin-yourcurrency/types";
import {
  YourCurrencyOnboardProgress,
  YourCurrencyOnboardResult,
} from "@ledgerhq/coin-yourcurrency/types";
import { getCurrencyBridge } from "@ledgerhq/live-common/bridge/index";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { map } from "rxjs/operators";
import { OnboardingBridge, OnboardProgress, OnboardResult } from "../types";

function isYourCurrencyBridge(bridge: unknown): bridge is YourCurrencyBridge {
  if (!bridge || typeof bridge !== "object") {
    return false;
  }
  const candidate = bridge as Record<string, unknown>;
  return "onboardAccount" in candidate && typeof candidate.onboardAccount === "function";
}

export function getYourCurrencyBridge(currency: CryptoCurrency): YourCurrencyBridge | null {
  const bridge = getCurrencyBridge(currency);
  if (!bridge) {
    return null;
  }
  if (isYourCurrencyBridge(bridge)) {
    return bridge as YourCurrencyBridge;
  }
  return null;
}

export function createYourCurrencyOnboardingBridge(
  yourCurrencyBridge: YourCurrencyBridge,
): OnboardingBridge {
  return {
    onboardAccount: (currency, deviceId, creatableAccount) => {
      return yourCurrencyBridge.onboardAccount(currency, deviceId, creatableAccount).pipe(
        map(
          (
            data: YourCurrencyOnboardProgress | YourCurrencyOnboardResult,
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
import { StepId, TranslationKeys, UrlConfig, OnboardingConfig } from "../types";

const yourCurrencyTranslationKeys: TranslationKeys = {
  title: "families.yourcurrency.addAccount.onboard.title",
  reonboardTitle: "families.yourcurrency.addAccount.reonboard.title",
  init: "families.yourcurrency.addAccount.onboard.init",
  reonboardInit: "families.yourcurrency.addAccount.reonboard.init",
  success: "families.yourcurrency.addAccount.onboard.success",
  reonboardSuccess: "families.yourcurrency.addAccount.reonboard.success",
  error: "families.yourcurrency.addAccount.onboard.error",
  error429: "families.yourcurrency.addAccount.onboard.error429",
  onboarded: "families.yourcurrency.addAccount.onboard.onboarded",
  account: "families.yourcurrency.addAccount.onboard.account",
  newAccount: "families.yourcurrency.addAccount.onboard.newAccount",
  statusPrepare: "families.yourcurrency.addAccount.onboard.status.prepare",
  statusSubmit: "families.yourcurrency.addAccount.onboard.status.submit",
  statusDefault: "families.yourcurrency.addAccount.onboard.status.default",
};

const yourCurrencyUrls: UrlConfig = {
  learnMore: urls.yourcurrency.learnMore,
};

export const yourCurrencyOnboardingConfig: OnboardingConfig = {
  stepComponents: {
    [StepId.ONBOARD]: StepOnboard,
    [StepId.FINISH]: StepFinish,
  },
  footerComponents: {
    [StepId.ONBOARD]: StepOnboardFooter,
    [StepId.FINISH]: StepFinishFooter,
  },
  translationKeys: yourCurrencyTranslationKeys,
  urls: yourCurrencyUrls,
  stepFlow: [StepId.ONBOARD, StepId.FINISH],
  transactionConfirmComponent: YourTransactionConfirm,
};
```

## Registration

In `registry.ts`, add to the maps:

```typescript
import {
  yourCurrencyOnboardingConfig,
  getYourCurrencyBridge,
  createYourCurrencyOnboardingBridge,
} from "./adapters/yourcurrency";

const onboardingConfigs: Record<string, OnboardingConfig> = {
  canton: cantonOnboardingConfig,
  yourcurrency: yourCurrencyOnboardingConfig,
};

const onboardingBridgeFactories: Record<
  string,
  (currency: CryptoCurrency) => OnboardingBridge | null
> = {
  canton: (currency: CryptoCurrency) => {
    /* ... */
  },
  yourcurrency: (currency: CryptoCurrency) => {
    const bridge = getYourCurrencyBridge(currency);
    return bridge ? createYourCurrencyOnboardingBridge(bridge) : null;
  },
};
```

## See Also

- `adapters/canton.ts` - Example implementation
- `registry.ts` - Registry implementation
- `types.ts` - Type definitions
