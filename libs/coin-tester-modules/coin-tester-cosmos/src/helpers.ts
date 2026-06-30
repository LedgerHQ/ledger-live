import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";

// Currencies exercised by the scenarios. Babylon (BABY) is x/epoching-wrapped;
// Cosmos Hub (ATOM) is the canonical, non-wrapped cosmos chain.
export const babylon = getCryptoCurrencyById("babylon");
export const cosmos = getCryptoCurrencyById("cosmos");
