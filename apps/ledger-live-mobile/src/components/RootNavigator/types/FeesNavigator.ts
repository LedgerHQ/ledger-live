import { Strategy } from "@ledgerhq/coin-evm/lib/types/index"
import { Account, AccountLike } from "@ledgerhq/types-live"
import BigNumber from "bignumber.js"
import { ScreenName } from "~/const"
import { FeeData } from "~/screens/Swap/LiveApp/customHandlers/getFee"

export type FeesNavigatorParamsList = {
  [ScreenName.FeeHomePage]: {
    account: AccountLike,
    feePayingAccount: Account,
    feesStrategy: Strategy,
    fromAmount: BigNumber | undefined,
    customFeeConfig: Record<string, unknown>,
    onSelect(feesStrategy: Strategy): Promise<void>,
  },
  [ScreenName.FeeCustomFeePage]: undefined,
}