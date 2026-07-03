"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LEDGER_LIVE_CLI_BIN = void 0;
exports.runCliCommand = runCliCommand;
exports.runCliCommandWithRetry = runCliCommandWithRetry;
exports.runCliLiveData = runCliLiveData;
exports.runCliGetAddress = runCliGetAddress;
exports.runCliTokenApproval = runCliTokenApproval;
exports.runCliGetTokenAllowance = runCliGetTokenAllowance;
const node_path_1 = __importDefault(require("node:path"));
const node_child_process_1 = require("node:child_process");
const index_1 = require("./index");
exports.LEDGER_LIVE_CLI_BIN = node_path_1.default.resolve(__dirname, "../../../apps/cli/bin/index.js");
function parseGetAddressCliOutput(output) {
    const lines = output
        .split("\n")
        .map(line => line.trim())
        .filter(line => line.length > 0);
    if (lines.length === 0) {
        throw new Error("CLI getAddress returned empty output");
    }
    const jsonLine = [...lines].reverse().find(line => line.startsWith("{") || line.startsWith("[")) ?? "";
    if (!jsonLine) {
        throw new Error("CLI getAddress output does not contain JSON");
    }
    let parsed;
    try {
        parsed = JSON.parse(jsonLine);
    }
    catch {
        throw new Error("Failed to parse CLI getAddress output");
    }
    if (typeof parsed !== "object" || parsed === null) {
        throw new Error(`CLI getAddress output is not an object. Raw output:\n${output}`);
    }
    const { address, path, publicKey } = parsed;
    if (typeof address !== "string" || typeof path !== "string" || typeof publicKey !== "string") {
        throw new Error(`CLI getAddress output missing address/path/publicKey. Raw output:\n${output}`);
    }
    return parsed;
}
function parseCliFlag(command, flag) {
    const parts = command.split("+");
    const idx = parts.findIndex(p => p === `--${flag}`);
    return idx !== -1 && idx + 1 < parts.length ? parts[idx + 1] : undefined;
}
/**
 * Transient failures (network, Speculos, gateway) where a CLI retry may help.
 */
function isRetryableError(message) {
    const retryablePatterns = [
        /503/i,
        /502/i,
        /504/i,
        /GeneralDmkError/i,
        /ECONNREFUSED/i,
        /ETIMEDOUT/i,
        /ECONNRESET/i,
        /socket hang up/i,
        /timeout/i,
    ];
    return retryablePatterns.some(pattern => pattern.test(message));
}
function runCliCommand(command) {
    console.warn(`[CLI] Executing: ledger-live ${command.replace(/\+/g, " ")}`);
    return new Promise((resolve, reject) => {
        const args = command.split("+");
        const cliBin = process.env.LEDGER_LIVE_CLI_BIN || exports.LEDGER_LIVE_CLI_BIN;
        const child = (0, node_child_process_1.spawn)("node", [cliBin, ...args], {
            stdio: "pipe",
            env: process.env,
        });
        let output = "";
        let errorOutput = "";
        child.stdout.on("data", data => {
            output += data.toString();
        });
        child.stderr.on("data", data => {
            errorOutput += data.toString();
        });
        child.on("exit", code => {
            if (code === 0) {
                resolve(output);
            }
            else {
                const currency = parseCliFlag(command, "currency");
                const index = parseCliFlag(command, "index");
                const indexText = index && index !== "undefined" ? index : "N/A";
                const errorDetails = [
                    `❌ Failed to execute CLI command`,
                    `🔍 Command: ${command}`,
                    `💱 Currency: ${currency}`,
                    `🔢 Index: ${indexText}`,
                    `🔢 Exit Code: ${code}`,
                    errorOutput ? `🧾 CLI Error : ${errorOutput.trim()}` : "",
                ].join("\n");
                reject((0, index_1.sanitizeError)(errorDetails));
            }
        });
        child.on("error", error => {
            reject(new Error(`Error executing CLI command: ${(0, index_1.sanitizeError)(error)}`));
        });
    });
}
async function runCliCommandWithRetry(command, retries = 3, delayMs = 3000) {
    let lastError = null;
    const currency = parseCliFlag(command, "currency");
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await runCliCommand(command);
        }
        catch (err) {
            lastError = err instanceof Error ? err : new Error(String(err));
            const willRetry = attempt < retries && isRetryableError(lastError.message);
            if (!willRetry) {
                throw (0, index_1.sanitizeError)(lastError);
            }
            console.warn(`⚠️ CLI attempt ${attempt}/${retries}${currency ? ` for ${currency}` : ""} failed with retryable error – retrying in ${delayMs}ms…`, lastError.message);
            await (0, index_1.sleep)(delayMs);
        }
    }
    throw (0, index_1.sanitizeError)(lastError);
}
function runCliLiveData(opts) {
    const cliOpts = ["liveData"];
    if (opts.currency)
        cliOpts.push(`--currency+${opts.currency}`);
    if (opts.index !== undefined)
        cliOpts.push(`--index+${opts.index}`);
    if (opts.appjson)
        cliOpts.push(`--appjson+${opts.appjson}`);
    if (opts.scheme)
        cliOpts.push(`--scheme+${opts.scheme}`);
    if (opts.add)
        cliOpts.push("--add");
    return runCliCommandWithRetry(cliOpts.join("+"));
}
async function runCliGetAddress(opts) {
    const cliOpts = ["getAddress"];
    if (opts.currency)
        cliOpts.push(`--currency+${opts.currency}`);
    if (opts.device)
        cliOpts.push(`--device+${opts.device}`);
    if (opts.path)
        cliOpts.push(`--path+${opts.path}`);
    if (opts.derivationMode)
        cliOpts.push(`--derivationMode+${opts.derivationMode}`);
    if (opts.verify)
        cliOpts.push("--verify");
    const output = await runCliCommandWithRetry(cliOpts.join("+"));
    return parseGetAddressCliOutput(output);
}
function runCliTokenApproval(opts) {
    const cliOpts = ["tokenApproval"];
    cliOpts.push(`--currency+${opts.currency}`);
    cliOpts.push(`--mode+${opts.mode}`);
    cliOpts.push(`--token+${opts.token}`);
    cliOpts.push(`--spender+${opts.spender}`);
    cliOpts.push(`--index+${opts.index}`);
    if (opts.approveAmount)
        cliOpts.push(`--approveAmount+${opts.approveAmount}`);
    if (opts.waitConfirmation)
        cliOpts.push("--wait-confirmation");
    return runCliCommandWithRetry(cliOpts.join("+"));
}
function runCliGetTokenAllowance(opts) {
    const cliOpts = ["tokenAllowance"];
    cliOpts.push(`--currency+${opts.currency}`);
    cliOpts.push(`--spender+${opts.spenderAddress}`);
    cliOpts.push(`--token+${opts.token}`);
    cliOpts.push(`--index+${opts.index}`);
    if (opts.format === "json")
        cliOpts.push("--format+json");
    if (opts.ownerAddress)
        cliOpts.push(`--ownerAddress+${opts.ownerAddress}`);
    return runCliCommandWithRetry(cliOpts.join("+"));
}
//# sourceMappingURL=runCli.js.map