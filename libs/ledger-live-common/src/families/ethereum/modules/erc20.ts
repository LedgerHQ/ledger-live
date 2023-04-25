// handle erc20 feature others than send.
import abi from "ethereumjs-abi";
import invariant from "invariant";
import eip55 from "eip55";
import { BigNumber } from "bignumber.js";
import type { ModeModule } from "../types";
import { AmountRequired } from "@ledgerhq/errors";
import { convertERC20, ERC20Token } from "@ledgerhq/cryptoassets";
import { inferTokenAccount } from "../transaction";
import { getAccountCurrency } from "../../../account";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { addTokens } from "../../../currencies";
import { DeviceTransactionField } from "../../../transaction";
import { getEnv } from "../../../env";
import { log } from "@ledgerhq/logs";
import network from "../../../network";
import { makeLRUCache } from "../../../cache";
import { findERC20SignaturesInfo } from "@ledgerhq/hw-app-eth/erc20";
import { LoadConfig } from "@ledgerhq/hw-app-eth/lib/services/types";

const infinite = new BigNumber(2).pow(256).minus(1);

function contractField(transaction) {
  return {
    type: "text",
    label: "Address",
    value: transaction.recipient,
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
    if (!t.useAllAmount) {
      if (t.amount.eq(0)) {
        result.errors.amount = new AmountRequired();
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

  fillDeviceTransactionConfig({ transaction, account }, fields) {
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

    fields.push(contractField(transaction) as DeviceTransactionField);
  },

  fillOptimisticOperation(_account, _transaction, operation) {
    operation.type = "FEES";
  },

  getResolutionConfig: () => ({ erc20: true, externalPlugins: true }),
};
export const modes: Record<Modes, ModeModule> = {
  "erc20.approve": erc20approve,
};

export const fetchERC20Tokens: () => Promise<ERC20Token[]> = makeLRUCache(
  async () => {
    let tokens: ERC20Token[];

    try {
      const { data } = await network({
        url: `${getEnv("DYNAMIC_CAL_BASE_URL")}/erc20.json`,
      });
      if (!data || !Array.isArray(data)) {
        throw new Error("ERC20.json file was malformed");
      }

      tokens = data;
    } catch (e: any) {
      log("preload-erc20", `failed to preload erc20 ${e.toString()}`);
      tokens = [];
    }

    return tokens;
  },
  () => "erc20-tokens",
  {
    ttl: 6 * 60 * 60 * 1000,
  }
);

export async function preload(
  currency: CryptoCurrency
): Promise<ERC20Token[] | null | undefined> {
  if (currency.id !== "ethereum") {
    return Promise.resolve(null);
  }

  try {
    const tokens = await fetchERC20Tokens();
    addTokens(tokens.map(convertERC20));
    return tokens;
  } catch (e) {
    log("Ethereum Family", "Error while adding tokens in preload", e);
    return [];
  }
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
