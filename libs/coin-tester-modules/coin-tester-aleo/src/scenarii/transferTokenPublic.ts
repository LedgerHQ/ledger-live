import BigNumber from "bignumber.js";
import { setupServer } from "msw/node";
import { firstValueFrom, reduce } from "rxjs";
import type { AccountBridge } from "@ledgerhq/types-live";
import type { Scenario, ScenarioTransaction } from "@ledgerhq/coin-tester/main";
import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { encodeTokenAccountId } from "@ledgerhq/ledger-wallet-framework/account";
import { TRANSACTION_TYPE } from "@ledgerhq/coin-aleo/constants";
import type {
  AleoAccount,
  AleoOperation,
  Transaction as AleoTransaction,
} from "@ledgerhq/coin-aleo/types";
import { mintTokens } from "../bootstrapToken";
import { createCryptoAssetsStore } from "../cryptoAssetsStore";
import {
  ALEO,
  GENESIS_ACCOUNT,
  TOKEN_MINT_AMOUNT,
  TOKEN_PROGRAM_ID,
  TOKEN_PUBLIC_DEVNODE_FEE_RANGE,
  TOKEN_SENDER_FUNDING,
  TOKEN_TRANSFER_AMOUNT,
  USAD_TOKEN,
  buildAleoCoinConfig,
  generateAleoAccount,
  getPublicBalance,
  getTokenBalance,
  makeAleoAccount,
  type GeneratedAleoAccount,
} from "../fixtures";
import { getBridges } from "../helpers";
import { buildAleoHandlers } from "../msw/handlers";
import { buildTransaction } from "../msw/prove";
import { buildMockAleoSigner } from "../signer";
import { advanceBlocks } from "../stack";

const mockServer = setupServer();

let sender: GeneratedAleoAccount;
let recipient: GeneratedAleoAccount;
let accountBridge: AccountBridge<AleoTransaction, AleoAccount>;
let subAccountId: string;

// Baselines read in beforeSync, at the top of every retry iteration — an
// await inside expect() escapes the harness's retry wrapper, so these are
// captured outside it and read synchronously in expect().
let previousBaselineSenderBalance: bigint;
let previousBaselineRecipientBalance: bigint;
let latestSenderBalance: bigint;
let latestRecipientBalance: bigint;

async function fundFromGenesis(recipientAddress: string, amount: number): Promise<void> {
  await buildTransaction({ recipient: recipientAddress, amount });

  for (let attempt = 0; attempt < 10; attempt++) {
    await advanceBlocks(1);
    if ((await getPublicBalance(recipientAddress)) >= BigInt(amount)) return;
  }

  throw new Error(`aleo coin-tester: funding transfer to ${recipientAddress} did not confirm`);
}

const sendToken: ScenarioTransaction<AleoTransaction, AleoAccount> = {
  name: `Send ${TOKEN_TRANSFER_AMOUNT} USAD from a minted sender to a fresh recipient`,
  mode: TRANSACTION_TYPE.TRANSFER_TOKEN_PUBLIC,
  get subAccountId() {
    return subAccountId;
  },
  amount: new BigNumber(TOKEN_TRANSFER_AMOUNT.toString()),
  get recipient() {
    return recipient.address;
  },
  expect: (previous, current) => {
    const newParentOperations = current.operations.filter(
      currentOp => !previous.operations.some(previousOp => previousOp.id === currentOp.id),
    ) as AleoOperation[];
    expect(newParentOperations).toHaveLength(1);
    const [parentOp] = newParentOperations;

    expect(parentOp.type).toBe("FEES");
    expect(parentOp.hasFailed).toBe(false);
    expect(parentOp.value).toStrictEqual(parentOp.fee);
    expect(parentOp.recipients).toStrictEqual([]);
    expect(parentOp.extra?.patched).toBe(true);
    expect(parentOp.subOperations).toHaveLength(1);
    expect(parentOp.fee.toNumber()).toBeGreaterThanOrEqual(TOKEN_PUBLIC_DEVNODE_FEE_RANGE.min);
    expect(parentOp.fee.toNumber()).toBeLessThanOrEqual(TOKEN_PUBLIC_DEVNODE_FEE_RANGE.max);

    const previousTokenAccount = previous.subAccounts?.[0];
    const currentTokenAccount = current.subAccounts?.[0];
    expect(currentTokenAccount).toBeDefined();
    const newTokenOperations = (currentTokenAccount?.operations ?? []).filter(
      currentOp =>
        !(previousTokenAccount?.operations ?? []).some(
          previousOp => previousOp.id === currentOp.id,
        ),
    ) as AleoOperation[];
    expect(newTokenOperations).toHaveLength(1);
    const [tokenOp] = newTokenOperations;

    expect(tokenOp.accountId).toBe(subAccountId);
    expect(tokenOp.type).toBe("OUT");
    expect(tokenOp.hasFailed).toBe(false);
    expect(tokenOp.value).toStrictEqual(new BigNumber(TOKEN_TRANSFER_AMOUNT.toString()));
    expect(tokenOp.senders).toStrictEqual([sender.address]);
    expect(tokenOp.recipients).toStrictEqual([recipient.address]);
    expect(tokenOp.extra?.functionId).toBe("transfer_public");
    expect(tokenOp.extra?.programId).toBe(TOKEN_PROGRAM_ID);
    expect(tokenOp.hash).toBe(parentOp.hash);
    expect(parentOp.subOperations).toContain(tokenOp.id);

    expect(current.balance).toStrictEqual(previous.balance.minus(parentOp.fee));
    expect(currentTokenAccount?.balance).toStrictEqual(
      new BigNumber(TOKEN_MINT_AMOUNT.toString()).minus(TOKEN_TRANSFER_AMOUNT.toString()),
    );

    expect(latestSenderBalance).toBe(previousBaselineSenderBalance - TOKEN_TRANSFER_AMOUNT);
    expect(latestRecipientBalance).toBe(previousBaselineRecipientBalance + TOKEN_TRANSFER_AMOUNT);
  },
};

export const scenarioTransferTokenPublic: Scenario<AleoTransaction, AleoAccount> = {
  name: "Ledger Live Aleo — public ARC-22 token transfer",

  setup: async () => {
    setCryptoAssetsStore(createCryptoAssetsStore([USAD_TOKEN]));

    [sender, recipient] = await Promise.all([generateAleoAccount(), generateAleoAccount()]);
    subAccountId = encodeTokenAccountId(
      makeAleoAccount(sender.address, sender.viewKey).id,
      USAD_TOKEN,
    );

    mockServer.listen({
      onUnhandledRequest: request => {
        const { hostname } = new URL(request.url);
        if (["127.0.0.1", "localhost"].includes(hostname)) return;
        throw new Error(`Unhandled request: ${request.method} ${request.url}`);
      },
    });
    mockServer.use(
      ...buildAleoHandlers({
        recipient: recipient.address,
        amount: Number(TOKEN_TRANSFER_AMOUNT),
        senderPrivateKey: sender.privateKey,
        programId: TOKEN_PROGRAM_ID,
      }),
    );

    await fundFromGenesis(sender.address, TOKEN_SENDER_FUNDING);
    await mintTokens({ admin: GENESIS_ACCOUNT, holder: sender.address, amount: TOKEN_MINT_AMOUNT });

    previousBaselineSenderBalance = await getTokenBalance(sender.address);
    previousBaselineRecipientBalance = await getTokenBalance(recipient.address);

    const signer = buildMockAleoSigner(sender.privateKey);
    const bridges = getBridges(signer, buildAleoCoinConfig({ enableTokens: true }));
    accountBridge = bridges.accountBridge;

    return {
      currencyBridge: bridges.currencyBridge,
      accountBridge,
      account: makeAleoAccount(sender.address, sender.viewKey),
      // beforeSync seals a block on every retry, so 20 retries at 1 s converge
      // faster than the framework's 30 s default would.
      retryInterval: 1000,
      retryLimit: 20,
    };
  },

  beforeSync: async () => {
    await advanceBlocks(1);
    latestSenderBalance = await getTokenBalance(sender.address);
    latestRecipientBalance = await getTokenBalance(recipient.address);
  },

  getTransactions: () => [sendToken],

  beforeAll: account => {
    expect(account.currency.id).toBe(ALEO.id);
    expect(account.subAccounts).toHaveLength(1);
    const [tokenAccount] = account.subAccounts ?? [];
    expect((tokenAccount as { token: { contractAddress: string } }).token.contractAddress).toBe(
      TOKEN_PROGRAM_ID,
    );
    expect(tokenAccount.balance).toStrictEqual(new BigNumber(TOKEN_MINT_AMOUNT.toString()));
  },

  afterAll: async account => {
    expect(await getTokenBalance(sender.address)).toBe(
      previousBaselineSenderBalance - TOKEN_TRANSFER_AMOUNT,
    );
    expect(await getTokenBalance(recipient.address)).toBe(TOKEN_TRANSFER_AMOUNT);

    const recipientAccount = await firstValueFrom(
      accountBridge
        .sync(makeAleoAccount(recipient.address, recipient.viewKey), { paginationConfig: {} })
        .pipe(reduce((acc, f) => f(acc), makeAleoAccount(recipient.address, recipient.viewKey))),
    );

    expect(recipientAccount.subAccounts).toHaveLength(1);
    const [recipientTokenAccount] = recipientAccount.subAccounts ?? [];
    expect(recipientTokenAccount.operations).toHaveLength(1);
    const [tokenIn] = recipientTokenAccount.operations as AleoOperation[];
    expect(tokenIn.type).toBe("IN");
    expect(tokenIn.value).toStrictEqual(new BigNumber(TOKEN_TRANSFER_AMOUNT.toString()));

    expect(recipientAccount.operations).toHaveLength(1);
    const [parentOp] = recipientAccount.operations as AleoOperation[];
    expect(parentOp.type).toBe("NONE");
    expect(parentOp.value.toNumber()).toBe(0);
    expect(parentOp.senders).toStrictEqual([]);
    expect(parentOp.recipients).toStrictEqual([]);

    void account;
  },

  teardown: () => {
    mockServer.close();
  },
};
