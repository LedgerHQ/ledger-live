'use strict';

// Requires the kaspa WASM SDK (nodejs/kaspa-dev) installed at /app/kaspa by the Dockerfile.
// The SDK is downloaded from the official rusty-kaspa GitHub release at build time.
const kaspa = require('/app/kaspa/kaspa.js');

kaspa.initConsolePanicHook();

const KASPAD_WRPC_URL = process.env.KASPAD_WRPC_URL || 'ws://kaspad:17110';
const MINING_ADDRESS = process.env.MINING_ADDRESS;

if (!MINING_ADDRESS) {
    console.error('MINING_ADDRESS env var is required');
    process.exit(1);
}

async function connectWithRetry(client, maxAttempts = 60) {
    for (let i = 1; i <= maxAttempts; i++) {
        try {
            await client.connect();
            return;
        } catch (e) {
            console.log(`Connection attempt ${i}/${maxAttempts} failed: ${e.message || e}`);
            if (i === maxAttempts) throw e;
            await new Promise(r => setTimeout(r, 2_000));
        }
    }
}

// Mine one block: get template, find nonce, submit. Returns immediately after submission.
async function mineOneBlock(client) {
    const { block } = await client.getBlockTemplate({
        payAddress: MINING_ADDRESS,
        extraData: 'ledger-tester',
    });

    // Stamp current time — prePowHash includes the timestamp.
    block.header.timestamp = BigInt(Date.now());
    const pow = new kaspa.PoW(block.header);

    let nonce = 0n;
    while (true) {
        const [valid] = pow.checkWork(nonce);
        if (valid) {
            block.header.nonce = nonce;
            try {
                await client.submitBlock({ block, allowNonDaaBlocks: false });
                console.log(`Block mined  nonce=${nonce}`);
            } catch (e) {
                // Stale template race — not a fatal error
                const msg = String(e.message || e);
                if (!msg.includes('BlockAlreadyExists') && !msg.includes('OrphanBlock')) {
                    console.warn(`submitBlock: ${msg}`);
                }
            }
            return;
        }
        nonce++;
    }
}

async function main() {
    const client = new kaspa.RpcClient({ url: KASPAD_WRPC_URL });

    console.log(`Connecting to kaspad at ${KASPAD_WRPC_URL} …`);
    await connectWithRetry(client);
    console.log(`Connected. Mining to ${MINING_ADDRESS}`);

    // Continuous mining loop — each iteration produces one block.
    while (true) {
        try {
            await mineOneBlock(client);
        } catch (e) {
            console.error(`Mining error: ${e.message || e}`);
            await new Promise(r => setTimeout(r, 1_000));
            if (!client.isConnected) {
                console.log('Reconnecting …');
                await connectWithRetry(client).catch(() => {});
            }
        }
    }
}

main().catch(e => {
    console.error('Fatal:', e);
    process.exit(1);
});
