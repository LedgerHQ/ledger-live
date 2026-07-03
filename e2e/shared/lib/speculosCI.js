"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpeculinhoAcquireError = void 0;
exports.waitForSpeculosReady = waitForSpeculosReady;
exports.getSpeculinhoRunIdFromError = getSpeculinhoRunIdFromError;
exports.createSpeculosDeviceCI = createSpeculosDeviceCI;
exports.releaseSpeculosDeviceCI = releaseSpeculosDeviceCI;
exports.fetchSpeculinhoLogs = fetchSpeculinhoLogs;
exports.fetchSpeculinhoStatus = fetchSpeculinhoStatus;
const axios_1 = __importDefault(require("axios"));
const speculos_transport_1 = require("@ledgerhq/speculos-transport");
const index_1 = require("./index");
const uuid_1 = require("uuid");
/** Speculinho operator base URL (no trailing slash). In CI, set via the `SPECULINHO_URL` secret / env var. */
function getSpeculinhoBaseUrl() {
    const raw = process.env.SPECULINHO_URL?.trim();
    return raw ? raw.replace(/\/+$/, "") : undefined;
}
const speculosPort = 443;
function uniqueId() {
    return (0, uuid_1.v4)();
}
function slugify(name) {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}
/**
 * DNS-1123 run_id for Speculinho (max 63 chars): lowercase, hyphens, alphanumeric.
 */
function makeRunId(deviceParams) {
    const slug = slugify(deviceParams.appName) || "app";
    const suffix = uniqueId().replace(/-/g, "").slice(0, 12);
    const combined = `${slug.slice(0, 20)}-${suffix}`;
    return combined.slice(0, 63);
}
function buildAcquirePayload(deviceParams, runId, seed) {
    const { model, firmware, appName, appVersion, dependencies } = deviceParams;
    const device = speculos_transport_1.reverseModelMap[model];
    if (!device) {
        throw new Error(`[speculosCI] Unsupported device model for Speculinho: ${String(model)}`);
    }
    const rawTag = process.env.SPECULOS_IMAGE_TAG?.trim();
    const tag = rawTag && rawTag.includes(":") ? rawTag.slice(rawTag.lastIndexOf(":") + 1) : rawTag || "latest";
    const libraries = dependencies?.map(dep => ({
        name: dep.name,
        path: `/apps/${(0, speculos_transport_1.conventionalAppSubpath)(model, firmware, dep.name, dep.appVersion ?? appVersion)}`,
    })) ?? undefined;
    return {
        coin_app: appName,
        coin_app_version: appVersion,
        device,
        device_os_version: firmware,
        seed,
        run_id: runId,
        speculos_version: tag,
        ...(libraries?.length ? { libraries } : {}),
        /** Matches legacy workflow `additional_args` / local Docker Detox (`-p`). */
        extra_args: ["-p"],
    };
}
async function waitForSpeculosReady(deviceId, { interval = 2_000, timeout = 150_000 } = {}) {
    const speculinhoUrl = getSpeculinhoBaseUrl();
    if (!speculinhoUrl) {
        throw new Error("SPECULINHO_URL is not set — required for remote Speculos (Speculinho operator).");
    }
    const statusUrl = `${speculinhoUrl}/status/${encodeURIComponent(deviceId)}`;
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
        try {
            const res = await axios_1.default.get(statusUrl, {
                timeout: 10_000,
                validateStatus: s => s >= 200 && s < 500,
            });
            if (res.status === 200 && res.data) {
                const { status, speculos_url, error_details } = res.data;
                if (status === "ready" && speculos_url) {
                    process.env.SPECULOS_ADDRESS = speculos_url.replace(/\/+$/, "");
                    console.warn(`Speculos is ready at ${process.env.SPECULOS_ADDRESS}`);
                    return;
                }
                if (status === "failed") {
                    throw new Error(`[speculosCI] Speculinho instance failed for ${deviceId}: ${error_details ?? JSON.stringify(res.data)}`);
                }
            }
        }
        catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            if (msg.includes("Speculinho instance failed")) {
                throw e;
            }
            console.warn(`Speculos status poll error (${deviceId}): ${(0, index_1.sanitizeError)(e)}`);
        }
        await new Promise(resolve => setTimeout(resolve, interval));
    }
    throw new Error(`Timeout: ${statusUrl} did not become ready within ${timeout}ms`);
}
function formatAcquireFailure(status, data) {
    const body = typeof data === "string" ? data : JSON.stringify(data);
    return `Speculinho POST /acquire failed with HTTP ${status}${body ? `: ${body}` : ""}`;
}
/**
 * Error thrown when Speculinho `/acquire` fails.
 * Carries the `run_id` so we can still fetch `/status` and `/logs`.
 */
class SpeculinhoAcquireError extends Error {
    runId;
    constructor(message, runId) {
        super(message);
        this.name = "SpeculinhoAcquireError";
        this.runId = runId;
    }
}
exports.SpeculinhoAcquireError = SpeculinhoAcquireError;
function getSpeculinhoRunIdFromError(error) {
    if (error instanceof SpeculinhoAcquireError)
        return error.runId;
    if (error && typeof error === "object" && "runId" in error) {
        const { runId } = error;
        if (typeof runId === "string" && runId)
            return runId;
    }
    return undefined;
}
async function createSpeculosDeviceCI(deviceParams) {
    const speculinhoUrl = getSpeculinhoBaseUrl();
    if (!speculinhoUrl) {
        throw new Error("[speculosCI] SPECULINHO_URL is not set. Set the env var (e.g. GitHub Actions secret SPECULINHO_URL on the iOS E2E job) to your Speculinho operator base URL.");
    }
    const seed = process.env.SEED?.trim();
    if (!seed) {
        throw new Error("[speculosCI] SEED is not set — required for Speculinho /acquire.");
    }
    let runId = makeRunId(deviceParams);
    for (let attempt = 0; attempt < 5; attempt++) {
        const payload = buildAcquirePayload(deviceParams, runId, seed);
        let res;
        try {
            res = await axios_1.default.post(`${speculinhoUrl}/acquire`, payload, {
                headers: { "Content-Type": "application/json" },
                validateStatus: () => true,
            });
        }
        catch (error) {
            throw new Error(`[speculosCI] Speculinho /acquire transport error (${speculinhoUrl}): ${(0, index_1.sanitizeError)(error)}`);
        }
        if (res.status === 202) {
            const finalRunId = res.data?.run_id ?? runId;
            return {
                id: finalRunId,
                port: speculosPort,
                appName: deviceParams.appName,
                appVersion: deviceParams.appVersion,
                dependencies: deviceParams.dependencies,
            };
        }
        if (res.status === 409) {
            runId = makeRunId(deviceParams);
            continue;
        }
        throw new SpeculinhoAcquireError(formatAcquireFailure(res.status, res.data), runId);
    }
    throw new SpeculinhoAcquireError(`[speculosCI] Speculinho /acquire failed after retries (run_id collisions). Last run_id: ${runId}`, runId);
}
async function releaseSpeculosDeviceCI(runId) {
    const speculinhoUrl = getSpeculinhoBaseUrl();
    if (!speculinhoUrl) {
        console.warn("[speculosCI] SPECULINHO_URL is not set; skipping Speculinho release.");
        return;
    }
    try {
        await axios_1.default.post(`${speculinhoUrl}/release`, { run_id: runId.toString() }, {
            headers: { "Content-Type": "application/json" },
            validateStatus: s => s >= 200 && s < 300,
        });
    }
    catch (error) {
        console.warn(`Failed to release remote Speculos ${runId}:`, (0, index_1.sanitizeError)(error));
    }
}
/**
 * Fetches Speculos pod stderr from Speculinho (GET /logs/{run_id}).
 * Call while the instance is still up (before POST /release).
 */
async function fetchSpeculinhoLogs(runId) {
    const speculinhoUrl = getSpeculinhoBaseUrl();
    if (!speculinhoUrl) {
        return "[speculosCI] SPECULINHO_URL is not set; cannot fetch Speculinho logs.";
    }
    const url = `${speculinhoUrl}/logs/${encodeURIComponent(runId)}`;
    try {
        const res = await axios_1.default.get(url, {
            responseType: "text",
            timeout: 10_000,
            validateStatus: () => true,
        });
        if (res.status === 200 && typeof res.data === "string") {
            return res.data;
        }
        const body = typeof res.data === "string" ? res.data : JSON.stringify(res.data ?? "");
        return `[speculosCI] Speculinho GET /logs/${runId} returned HTTP ${res.status}${body ? `\n${body}` : ""}`;
    }
    catch (error) {
        return `[speculosCI] Speculinho GET /logs failed: ${(0, index_1.sanitizeError)(error).message}`;
    }
}
/**
 * Fetches Speculinho pod status (GET /status/{run_id}).
 * Useful as extra debug on failure — surfaces pod state (Running / CrashLoopBackOff / …) and any kube-side error.
 */
async function fetchSpeculinhoStatus(runId) {
    const speculinhoUrl = getSpeculinhoBaseUrl();
    if (!speculinhoUrl) {
        return "[speculosCI] SPECULINHO_URL is not set; cannot fetch Speculinho status.";
    }
    const url = `${speculinhoUrl}/status/${encodeURIComponent(runId)}`;
    try {
        const res = await axios_1.default.get(url, {
            timeout: 10_000,
            validateStatus: () => true,
        });
        const body = typeof res.data === "string" ? res.data : JSON.stringify(res.data ?? "", null, 2);
        if (res.status === 200) {
            return body;
        }
        return `[speculosCI] Speculinho GET /status/${runId} returned HTTP ${res.status}${body ? `\n${body}` : ""}`;
    }
    catch (error) {
        return `[speculosCI] Speculinho GET /status failed: ${(0, index_1.sanitizeError)(error).message}`;
    }
}
//# sourceMappingURL=speculosCI.js.map