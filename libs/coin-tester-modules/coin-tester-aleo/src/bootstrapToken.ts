import {
  assertGenesisAccountIsFunded,
  ALEO_LOCAL_NODE,
  BATCHER_PROGRAM_ID,
  TOKEN_DECIMALS,
  TOKEN_FREEZELIST_PROGRAM_ID,
  TOKEN_FREEZE_LIST_BLOCK_HEIGHT_WINDOW,
  TOKEN_MAX_SUPPLY,
  TOKEN_NAME_U128,
  TOKEN_PROGRAM_ID,
  TOKEN_SYMBOL_U128,
} from "./fixtures";
import {
  broadcastTransaction,
  getBlock,
  getLatestHeight,
  getProgramSource,
  resolveProgramImports,
  type DevnodeConfirmedTransaction,
} from "./devnode";
import { advanceBlocks } from "./stack";
import { timed } from "./timing";
import { loadTokenPrograms, readRawProgramSource, type TokenProgram } from "./tokenContracts";
import { loadAleoWasm } from "./wasm";

const CONFIRM_POLL_BLOCKS = 15;

type Admin = { privateKey: string; address: string };

/**
 * Scans every block from `sinceHeight + 1` through the current latest height
 * for `id`, returning its confirmed entry if found. Broadcasting a
 * transaction against this devnode mines it into a block immediately — before
 * the broadcast HTTP response even returns — so by the time a poll loop's own
 * `advanceBlocks(1)` runs, the confirming block is already one or more behind
 * "latest". Checking only the single latest block (as a first attempt at this
 * did) never finds it. `sinceHeight` must be read before broadcasting.
 */
async function findTransactionSince(
  id: string,
  sinceHeight: number,
): Promise<DevnodeConfirmedTransaction | undefined> {
  const latest = await getLatestHeight();
  for (let current = sinceHeight + 1; current <= latest; current++) {
    const block = await getBlock(current);
    const found = block.transactions?.find(entry => entry.transaction.id === id);
    if (found) return found;
  }
  return undefined;
}

async function reportUnconfirmed(id: string, label: string, sinceHeight: number): Promise<never> {
  const found = await findTransactionSince(id, sinceHeight);
  throw new Error(
    `aleo coin-tester: ${label} did not confirm within ${CONFIRM_POLL_BLOCKS} blocks` +
      (found
        ? ` (last seen status: ${found.status})`
        : " (transaction id not found in any block since broadcast)"),
  );
}

/**
 * Advances the chain one block at a time, checking `isConfirmed` after each,
 * up to CONFIRM_POLL_BLOCKS attempts. Reports the confirming block's status on
 * a timeout so a caller never mistakes "never polled long enough" for
 * "rejected".
 */
async function pollForConfirmation(
  id: string,
  label: string,
  sinceHeight: number,
  isConfirmed: () => Promise<boolean>,
): Promise<void> {
  for (let attempt = 0; attempt < CONFIRM_POLL_BLOCKS; attempt++) {
    if (await isConfirmed()) return;
    await advanceBlocks(1);
  }

  await reportUnconfirmed(id, label, sinceHeight);
}

/**
 * `getTransaction(id)` alone cannot tell a rejected execution from an
 * accepted one: the devnode's `transaction/{id}` route returns the raw
 * transaction either way (a rejected execution still lands in a block — fee
 * charged, no state change). Only the block-level `status` field on the
 * transaction's `DevnodeConfirmedTransaction` entry distinguishes them, so
 * this scans every block since `sinceHeight`, the same way `msw/node.ts`'s
 * `findConfirmedTransaction` does.
 */
async function isTransactionAccepted(id: string, sinceHeight: number): Promise<boolean> {
  const confirmed = await findTransactionSince(id, sinceHeight);
  if (!confirmed) return false;
  if (confirmed.status !== "accepted") {
    throw new Error(
      `aleo coin-tester: transaction ${id} was rejected (status '${confirmed.status}')`,
    );
  }
  return true;
}

async function deployProgram(program: TokenProgram, admin: Admin): Promise<void> {
  const wasm = await loadAleoWasm();
  const imports = await resolveProgramImports(program.source);
  const sinceHeight = await getLatestHeight();

  const transaction = await timed(`deploy ${program.id}`, () =>
    wasm.ProgramManagerBase.buildDevnodeDeploymentTransaction(
      wasm.PrivateKey.from_string(admin.privateKey),
      program.source,
      0,
      undefined,
      ALEO_LOCAL_NODE,
      imports,
    ),
  );

  await broadcastTransaction(transaction.toString());

  await pollForConfirmation(
    transaction.id(),
    `deployment of ${program.id}`,
    sinceHeight,
    async () => Boolean(await getProgramSource(program.id).catch(() => null)),
  );
}

async function runExecution(params: {
  label: string;
  programId: string;
  functionName: string;
  inputs: string[];
  signerPrivateKey: string;
}): Promise<void> {
  const wasm = await loadAleoWasm();
  const source = await getProgramSource(params.programId);
  const imports = await resolveProgramImports(source);
  const sinceHeight = await getLatestHeight();

  const transaction = await timed(params.label, () =>
    wasm.ProgramManagerBase.buildDevnodeExecutionTransaction(
      wasm.PrivateKey.from_string(params.signerPrivateKey),
      source,
      params.functionName,
      params.inputs,
      0,
      undefined,
      ALEO_LOCAL_NODE,
      imports,
    ),
  );

  await broadcastTransaction(transaction.toString());

  await pollForConfirmation(transaction.id(), params.label, sinceHeight, () =>
    isTransactionAccepted(transaction.id(), sinceHeight),
  );
}

/**
 * Deploys the four-program chain and initializes the freezelist and
 * stablecoin, all signed by `admin`. Runs once per test file, ahead of any
 * holder existing — see deployTokenPrograms's callers in scenarii.test.ts.
 *
 * Every step is holder-independent: nothing here skips work when the program
 * is already deployed, because spawnStack() always starts the devnode from
 * genesis with `--clear-storage` — a skip branch would never execute.
 */
export async function deployTokenPrograms(admin: Admin): Promise<void> {
  await assertGenesisAccountIsFunded();

  for (const program of loadTokenPrograms(admin.address)) {
    await deployProgram(program, admin);
  }

  await runExecution({
    label: `${TOKEN_FREEZELIST_PROGRAM_ID}/initialize`,
    programId: TOKEN_FREEZELIST_PROGRAM_ID,
    functionName: "initialize",
    inputs: [admin.address, `${TOKEN_FREEZE_LIST_BLOCK_HEIGHT_WINDOW}u32`],
    signerPrivateKey: admin.privateKey,
  });

  await runExecution({
    label: `${TOKEN_PROGRAM_ID}/initialize`,
    programId: TOKEN_PROGRAM_ID,
    functionName: "initialize",
    inputs: [
      `${TOKEN_NAME_U128}u128`,
      `${TOKEN_SYMBOL_U128}u128`,
      `${TOKEN_DECIMALS}u8`,
      `${TOKEN_MAX_SUPPLY}u128`,
      admin.address,
    ],
    signerPrivateKey: admin.privateKey,
  });

  // 9u16 keeps the admin bit (8u16) and adds the mint bit (1u16) — update_role
  // requires the caller to keep its own admin bit when changing its own role.
  await runExecution({
    label: `${TOKEN_PROGRAM_ID}/update_role(admin, 9u16)`,
    programId: TOKEN_PROGRAM_ID,
    functionName: "update_role",
    inputs: [admin.address, "9u16"],
    signerPrivateKey: admin.privateKey,
  });
}

/**
 * Deploys `ldg_p_1114.aleo`, the credits batcher an 11-to-14-record private
 * send-max routes through, so `getProgramSource` can serve it to
 * `buildTransaction`. It carries no admin gate literal, so its vendored
 * source deploys unpatched. Called from a scenario's setup(), the same as
 * `deployTokenPrograms`.
 */
export async function deployBatcherProgram(admin: Admin): Promise<void> {
  await assertGenesisAccountIsFunded();
  await deployProgram(
    { id: BATCHER_PROGRAM_ID, source: readRawProgramSource(BATCHER_PROGRAM_ID) },
    admin,
  );
}

/** Mints `amount` tokens to `holder`. Called from a scenario's setup(), once the holder exists. */
export async function mintTokens(params: {
  admin: Admin;
  holder: string;
  amount: bigint;
}): Promise<void> {
  await assertGenesisAccountIsFunded();

  await runExecution({
    label: `${TOKEN_PROGRAM_ID}/mint_public(${params.holder}, ${params.amount})`,
    programId: TOKEN_PROGRAM_ID,
    functionName: "mint_public",
    inputs: [params.holder, `${params.amount}u128`],
    signerPrivateKey: params.admin.privateKey,
  });
}
