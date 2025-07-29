import { genAccount } from "@ledgerhq/coin-framework/lib/mocks/account";
import BigNumber from "bignumber.js";
import { mockBtcCryptoCurrency } from "./currencies.mock";
import { mockArbitrumCryptoCurrency } from "./currencies.mock";
import { mockEthCryptoCurrency } from "./currencies.mock";
import { mockBaseCryptoCurrency } from "./currencies.mock";
import { mockScrollCryptoCurrency } from "./currencies.mock";

export const MOCKED_ARB_ACCOUNT = {
  type: "Account",
  id: "arbitrum1",
  balance: new BigNumber(34455),
  creationDate: "2024-12-10T09:27:22.000Z",
  currency: mockArbitrumCryptoCurrency,
  derivationMode: "",
  freshAddress: "s37rhmi7hsm3i73hsm7i3hm83m8h87hsm87h3s8h33",
};

export const ETH_ACCOUNT = genAccount("ethereum-1", {
  currency: mockEthCryptoCurrency,
});
export const ETH_ACCOUNT_2 = genAccount("ethereum-2", {
  currency: mockEthCryptoCurrency,
});
export const BTC_ACCOUNT = genAccount("bitcoin-1", {
  currency: mockBtcCryptoCurrency,
});
export const ARB_ACCOUNT = genAccount("arbitrum-1", {
  currency: mockArbitrumCryptoCurrency,
  tokenIds: ["arbitrum/erc20/arbitrum"],
});
export const ETH_ACCOUNT_WITH_USDC = genAccount("ethereum-usdc", {
  currency: mockEthCryptoCurrency,
  tokenIds: ["ethereum/erc20/usdc"],
});
export const BASE_ACCOUNT = genAccount("base-1", {
  currency: mockBaseCryptoCurrency,
  operationsSize: 100,
});
export const SCROLL_ACCOUNT = genAccount("scroll-1", {
  currency: mockScrollCryptoCurrency,
  operationsSize: 100,
});
