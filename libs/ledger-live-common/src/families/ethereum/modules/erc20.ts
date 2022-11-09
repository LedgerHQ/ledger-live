// handle erc20 feature others than send.
import abi from "ethereumjs-abi";
import invariant from "invariant";
import eip55 from "eip55";
import { BigNumber } from "bignumber.js";
import type { ModeModule } from "../types";
import { AmountRequired } from "@ledgerhq/errors";
import {
  findTokenByAddressInCurrency,
  convertERC20,
  ERC20Token,
} from "@ledgerhq/cryptoassets";
import { inferTokenAccount, validateRecipient } from "../transaction";
import {
  getAccountCurrency,
  getAccountUnit,
  getMainAccount,
} from "../../../account";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import {
  findTokenById,
  formatCurrencyUnit,
  addTokens,
} from "../../../currencies";
import { getAccountCapabilities } from "../../../compound/logic";
import { CompoundLowerAllowanceOfActiveAccountError } from "../../../errors";
import { DeviceTransactionField } from "../../../transaction";
import { getEnv } from "../../../env";
import { log } from "@ledgerhq/logs";
import network from "../../../network";
import { makeLRUCache } from "../../../cache";
import { findERC20SignaturesInfo } from "@ledgerhq/hw-app-eth/erc20";
import { LoadConfig } from "@ledgerhq/hw-app-eth/lib/services/types";

const infinite = new BigNumber(2).pow(256).minus(1);

function contractField(transaction, currency) {
  const recipientToken = findTokenByAddressInCurrency(
    transaction.recipient,
    currency.id
  );
  const maybeCompoundToken = findTokenById(recipientToken?.compoundFor || "");
  return {
    type: "text",
    label: maybeCompoundToken ? "Contract" : "Address",
    value: maybeCompoundToken
      ? "Compound " + maybeCompoundToken.ticker
      : transaction.recipient,
  };
}

export type Modes = "erc20.approve";

/**
 * "erc20.approve" allows a "spender" (e.g. contract address) to consume some erc20 tokens.
 * transaction params:
 * - transaction.recipient address of the spender
 * - transaction.amount in the token unit to allow
 * - transaction.useAllAmount intend to allow infinite amount (setting a very high value)
 */
const erc20approve: ModeModule = {
  fillTransactionStatus(a, t, result) {
    const subAccount = inferTokenAccount(a, t);
    const { status, enabledAmount } =
      (subAccount && getAccountCapabilities(subAccount)) || {};
    validateRecipient(a.currency, t.recipient, result);

    if (!t.useAllAmount) {
      if (t.amount.eq(0)) {
        result.errors.amount = new AmountRequired();
      } else if (
        subAccount &&
        status &&
        enabledAmount &&
        ["EARNING", "SUPPLYING"].includes(status) &&
        t.amount.lt(enabledAmount)
      ) {
        const unit = getAccountUnit(subAccount);
        // if account curently supplied we can't lower the initial amount enabled just augment it
        result.errors.amount = new CompoundLowerAllowanceOfActiveAccountError(
          undefined,
          {
            minimumAmount: formatCurrencyUnit(unit, enabledAmount, {
              disableRounding: true,
              useGrouping: false,
              showCode: true,
            }),
          }
        );
      }
    }

    result.amount = t.amount;
  },

  fillTransactionData(a, t, tx) {
    const subAccount = inferTokenAccount(a, t);
    invariant(subAccount, "sub account missing");
    // FIXME: make sure it doesn't break
    if (!subAccount) throw new Error("sub account missing");
    const recipient = eip55.encode(t.recipient);
    let amount;

    if (t.useAllAmount) {
      amount = infinite;
    } else {
      invariant(t.amount, "amount missing");
      amount = new BigNumber(t.amount);
    }

    const data = abi.simpleEncode(
      "approve(address,uint256)",
      recipient,
      amount.toString(10)
    );
    tx.data = "0x" + data.toString("hex");
    tx.to = subAccount.token.contractAddress;
    tx.value = "0x00";
    return {
      erc20contracts: [recipient],
    };
  },

  fillDeviceTransactionConfig({ transaction, account, parentAccount }, fields) {
    fields.push({
      type: "text",
      label: "Type",
      value: "Approve",
    });

    if (transaction.useAllAmount) {
      fields.push({
        type: "text",
        label: "Amount",
        value: "Unlimited " + getAccountCurrency(account).ticker,
      });
    } else {
      // TODO amount should be just text in future
      fields.push({
        type: "amount",
        label: "Amount",
      });
    }

    fields.push(
      contractField(
        transaction,
        getMainAccount(account, parentAccount).currency
      ) as DeviceTransactionField
    );
  },

  fillOptimisticOperation(_account, _transaction, operation) {
    operation.type = "FEES";
  },

  getResolutionConfig: () => ({ erc20: true, externalPlugins: true }),
};
export const modes: Record<Modes, ModeModule> = {
  "erc20.approve": erc20approve,
};

export const fetchERC20Tokens: () => Promise<ERC20Token[]> = async () => {
  let tokens: ERC20Token[];

  try {
    const { data } = await network({
      url: `${getEnv("DYNAMIC_CAL_BASE_URL")}/erc20.json`,
    });

    tokens = data;
  } catch (e: any) {
    log("preload-erc20", `failed to preload erc20 ${e.toString()}`);
    tokens = [];
  }

  return tokens;
};

export async function preload(
  currency: CryptoCurrency
): Promise<ERC20Token[] | null | undefined> {
  if (currency.id !== "ethereum") {
    return Promise.resolve(null);
  }

  const tokens = await fetchERC20Tokens();
  addTokens(tokens.map(convertERC20));
  return tokens;
}

export function hydrate(
  value: ERC20Token[] | null | undefined,
  currency: CryptoCurrency
): void {
  if (currency.id !== "ethereum" || !value) return;
  addTokens(value.map(convertERC20));
  log("ethereum/preload", "hydrate " + value.length + " tokens");
}

export const erc20SignatureInfo: (
  loadConfig: LoadConfig
) => Promise<string | undefined | null> = makeLRUCache(
  async (loadConfig: LoadConfig) => findERC20SignaturesInfo(loadConfig),
  () => "erc20-signatures"
);
