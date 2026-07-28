'use strict';

const http = require('http');

// Requires the kaspa WASM SDK (nodejs/kaspa-dev) installed at /app/kaspa by the Dockerfile.
// The SDK is downloaded from the official rusty-kaspa GitHub release at build time.
const kaspa = require('/app/kaspa/kaspa.js');

kaspa.initConsolePanicHook();

const KASPAD_WRPC_URL = process.env.KASPAD_WRPC_URL || 'ws://kaspad:17110';
const MINING_ADDRESS = process.env.MINING_ADDRESS;
const PORT = parseInt(process.env.MINER_HTTP_PORT || '3939', 10);

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
    console.log(`Connected. Mining to ${MINING_ADDRESS}. HTTP server on port ${PORT}`);

    let busy = false;

    const server = http.createServer((req, res) => {
        if (req.method === 'GET' && req.url === '/health') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: true, connected: client.isConnected }));
            return;
        }

        if (req.method === 'POST' && req.url === '/mine') {
            if (busy) {
                res.writeHead(409, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'mining in progress' }));
                return;
            }

            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', async () => {
                const { count = 1, intervalMs = 0 } = JSON.parse(body || '{}');
                busy = true;
                try {
                    for (let i = 0; i < count; i++) {
                        await mineOneBlock(client);
                        if (intervalMs > 0) {
                            await new Promise(r => setTimeout(r, intervalMs));
                        }
                    }
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ mined: count }));
                } catch (e) {
                    console.error(`Mining error: ${e.message || e}`);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: e.message || String(e) }));
                    if (!client.isConnected) {
                        connectWithRetry(client).catch(() => {});
                    }
                } finally {
                    busy = false;
                }
            });
            return;
        }

        res.writeHead(404);
        res.end();
    });

    server.listen(PORT, () => {
        console.log(`Miner HTTP server ready on port ${PORT}`);
    });
}

main().catch(e => {
    console.error('Fatal:', e);
    process.exit(1);
});
