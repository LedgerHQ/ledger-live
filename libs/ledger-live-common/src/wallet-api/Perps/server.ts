import calService, { convertCertificateToDeviceData } from "@ledgerhq/ledger-cal-service";
import { DmkSignerHyperliquid } from "@ledgerhq/live-signer-hyperliquid";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { customWrapper } from "@ledgerhq/wallet-api-server";
import { convertAction, type ActionWithNonce } from "./types";
import { getAccountIdFromWalletAccountId, getWalletApiIdFromAccountId } from "../converters";
import {
  findMigrationAccount,
  type PerpsMigrationParams,
  type PerpsMigrationResult,
} from "./migration";
import {
  createAccountNotFound,
  createNotImplementedByWallet,
  createUnknownError,
  ServerError,
} from "@ledgerhq/wallet-api-core";
import { z } from "zod";
import { HYPERCORE_CURRENCY_ID } from "./constants";
import { getMainAccount, getParentAccount } from "../../account";
import { firstValueFrom, from } from "rxjs";
import type Transport from "@ledgerhq/hw-transport";
import { Device } from "../../hw/actions/types";
import { withDevice } from "../../hw/deviceAccess";
import { isDmkTransport } from "../../hw/dmkUtils";
import { stripHexPrefix } from "../helpers";

type AppOption = {
  requireLatestFirmware: boolean;
  allowPartialDependencies: boolean;
  skipAppInstallIfNotFound: boolean;
};

export type PerpsDepositParams = {
  receiverAccountId: string;
};

export type PerpsDepositResult = {
  /** Only set when the provider issued one, so the deposit can be tracked. */
  swapId?: string;
  /** Amount quoted to land on the receiver account, in its currency's major unit. */
  amountTo?: string;
};

export type PerpsDepositUiParams = {
  receiverAccount: AccountLike;
};

export type PerpsDepositReviewParams = PerpsDepositUiParams & {
  depositAccount: AccountLike;
  amountSent: string;
  amountTo: string;
  quoteId?: string;
};

export type PerpsWithdrawParams = {
  sourceAccountId: string;
};

export type PerpsWithdrawResult = {
  swapId?: string;
  amountFrom?: string;
  amountTo?: string;
  toCurrencyId?: string;
};

export type PerpsWithdrawUiParams = {
  sourceAccount: AccountLike;
};

const PerpsWithdrawParamsSchema = z.object({
  sourceAccountId: z.string().min(1),
});

export type PerpsUiHooks = {
  "signing.execute": (params: {
    appName: string | undefined;
    appOptions?: AppOption;
    signFactory: (device: Device) => Promise<PerpsSignResult>;
    onSuccess: (result: PerpsSignResult) => void;
    onError: (error: Error) => void;
    onCancel: () => void;
  }) => void;
  "deposit.execute"?: (params: PerpsDepositUiParams) => Promise<PerpsDepositResult> | void;
  /**
   * Runs the add account flow for Hyperliquid and resolves with the accounts the user added; other
   * wallet accounts may come along, only the one at the legacy account's address is used.
   * Only called when the wallet has no Hyperliquid account at that address.
   * Reject with a `UserRefused*` error when the user abandons.
   */
  "migration.execute"?: () => Promise<Account[]>;
  "withdraw.execute"?: (params: PerpsWithdrawUiParams) => Promise<PerpsWithdrawResult> | void;
};

export type PerpsSignParams = {
  accountId: string;
  metadataWithSignature: string;
  actions: ActionWithNonce[];
  options?: AppOption;
};
export type Signature = {
  r: string;
  s: string;
  v: number;
};
export type PerpsSignResult = {
  signatures: Signature[];
};

const PERPS_APP_NAME = "Hyperliquid";
/** Legacy Perps accounts are identified by their Arbitrum account. */
const LEGACY_CURRENCY_ID = "arbitrum";

async function signActionsOnDevice(
  transport: Transport,
  device: Device,
  derivationPath: string,
  params: PerpsSignParams,
): Promise<PerpsSignResult> {
  if (!isDmkTransport(transport)) {
    throw new Error("Not DMK transport");
  }
  const { dmk, sessionId } = transport;

  const certificate = await calService.getCertificate(device.modelId, "perps_data");
  const hyperliquidSigner = new DmkSignerHyperliquid(dmk, sessionId);
  const signatures = await hyperliquidSigner.signActions(
    derivationPath,
    convertCertificateToDeviceData(certificate),
    new Uint8Array(Buffer.from(stripHexPrefix(params.metadataWithSignature), "hex")),
    params.actions.map(convertAction),
  );

  return { signatures };
}

function createSignFactory(derivationPath: string, params: PerpsSignParams) {
  return (device: Device): Promise<PerpsSignResult> =>
    firstValueFrom(
      withDevice(
        device.deviceId,
        device.deviceName ? { matchDeviceByName: device.deviceName } : undefined,
      )(transport => from(signActionsOnDevice(transport, device, derivationPath, params))),
    );
}

export const handlers = ({
  accounts,
  uiHooks: {
    "signing.execute": uiSigningExecute,
    "deposit.execute": uiDepositExecute,
    "migration.execute": uiMigrationExecute,
    "withdraw.execute": uiWithdrawExecute,
  },
}: {
  accounts: AccountLike[];
  uiHooks: PerpsUiHooks;
}) => {
  const findAccountOrThrow = (walletAccountId: string): AccountLike => {
    const accountId = getAccountIdFromWalletAccountId(walletAccountId);
    const account = accounts.find(acc => acc.id === accountId);
    if (!account) {
      throw new ServerError(createAccountNotFound(walletAccountId));
    }
    return account;
  };

  return {
    "custom.perps.signActions": customWrapper<PerpsSignParams, PerpsSignResult>(async params => {
      if (!params) {
        throw new ServerError(createUnknownError({ message: "params is undefined" }));
      }

      const account = findAccountOrThrow(params.accountId);

      const derivationPath = getMainAccount(
        account,
        getParentAccount(account, accounts),
      )?.freshAddressPath;
      if (!derivationPath) {
        throw new ServerError(
          createUnknownError({ message: "unable to retrieve derivation path" }),
        );
      }

      return new Promise<PerpsSignResult>((resolve, reject) => {
        uiSigningExecute({
          appName: PERPS_APP_NAME,
          appOptions: params.options,
          signFactory: createSignFactory(derivationPath, params),
          onSuccess: resolve,
          onError: reject,
          onCancel: () => reject(new Error("User cancelled signing")),
        });
      });
    }),
    "custom.perps.deposit": customWrapper<PerpsDepositParams, PerpsDepositResult>(async params => {
      if (!params) {
        throw new ServerError(createUnknownError({ message: "params is undefined" }));
      }

      if (!uiDepositExecute) {
        throw new ServerError(
          createUnknownError({ message: "deposit is not supported by this client" }),
        );
      }

      const receiverAccount = findAccountOrThrow(params.receiverAccountId);

      try {
        return (await uiDepositExecute({ receiverAccount })) ?? {};
      } catch (error) {
        console.warn("[perps] Deposit request rejected", error);
        throw error;
      }
    }),
    "custom.perps.migrateAccount": customWrapper<PerpsMigrationParams, PerpsMigrationResult>(
      async params => {
        if (!params) {
          throw new ServerError(createUnknownError({ message: "params is undefined" }));
        }

        if (!uiMigrationExecute) {
          throw new ServerError(
            createUnknownError({ message: "migration is not supported by this client" }),
          );
        }

        const legacyAccount = findAccountOrThrow(params.legacyAccountId);
        if (legacyAccount.type !== "Account" || legacyAccount.currency.id !== LEGACY_CURRENCY_ID) {
          throw new ServerError(
            createUnknownError({ message: "legacy Perps account must be a main Arbitrum account" }),
          );
        }

        const existingAccount = findMigrationAccount(accounts, legacyAccount);
        if (existingAccount) {
          return {
            accounts: [
              { accountId: getWalletApiIdFromAccountId(existingAccount.id), created: false },
            ],
          };
        }

        let addedAccounts: Account[];
        try {
          addedAccounts = await uiMigrationExecute();
        } catch (error) {
          console.warn("[perps] Migration request rejected", error);
          throw error;
        }

        const migratedAccount = findMigrationAccount(addedAccounts, legacyAccount);
        if (!migratedAccount) {
          throw new ServerError(
            createUnknownError({
              message: "no Hyperliquid account at the legacy Perps account address was added",
            }),
          );
        }
        return {
          accounts: [{ accountId: getWalletApiIdFromAccountId(migratedAccount.id), created: true }],
        };
      },
    ),
    "custom.perps.withdraw": customWrapper<PerpsWithdrawParams, PerpsWithdrawResult>(
      async params => {
        if (!uiWithdrawExecute) {
          throw new ServerError(createNotImplementedByWallet("custom.perps.withdraw"));
        }

        const parsed = PerpsWithdrawParamsSchema.safeParse(params);
        if (!parsed.success) {
          throw new ServerError(createUnknownError({ message: "invalid withdraw params" }));
        }

        const sourceAccount = findAccountOrThrow(parsed.data.sourceAccountId);
        if (
          sourceAccount.type !== "Account" ||
          sourceAccount.currency.id !== HYPERCORE_CURRENCY_ID
        ) {
          throw new ServerError(
            createUnknownError({ message: "withdraw source must be a HyperCore account" }),
          );
        }

        try {
          return (await uiWithdrawExecute({ sourceAccount })) ?? {};
        } catch (error) {
          console.warn("[perps] Withdraw request rejected", error);
          throw error;
        }
      },
    ),
  };
};
