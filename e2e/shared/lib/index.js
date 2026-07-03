"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeError = exports.formatEnvData = exports.formatFlagsData = void 0;
exports.sleep = sleep;
const axios_1 = __importDefault(require("axios"));
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
const formatFlagsData = (data) => {
    let allureData = "";
    for (const [key, value] of Object.entries(data)) {
        if (!value)
            continue;
        if (!value.enabled)
            continue;
        allureData += `FF.${key} = ${value.enabled}\n`;
        const entries = {
            desktop_version: value.desktop_version,
            mobile_version: value.mobile_version,
            enabledOverriddenForCurrentVersion: value.enabledOverriddenForCurrentVersion,
            languages_whitelisted: value.languages_whitelisted?.join(", "),
            languages_blacklisted: value.languages_blacklisted?.join(", "),
            enabledOverriddenForCurrentLanguage: value.enabledOverriddenForCurrentLanguage,
            overridesRemote: value.overridesRemote,
            overriddenByEnv: value.overriddenByEnv,
            params: value.params ? JSON.stringify(value.params) : undefined,
        };
        for (const [field, fieldValue] of Object.entries(entries)) {
            if (fieldValue !== undefined) {
                allureData += `FF.${key}.${field} = ${fieldValue
                    .toString()
                    .replace(/^\{|\}$/g, "")
                    .replace(/"/g, " ")}\n`;
            }
        }
    }
    return allureData;
};
exports.formatFlagsData = formatFlagsData;
const SENSITIVE_ENV_KEYS = new Set(["SEED"]);
const formatEnvData = (data) => {
    let allureData = "";
    for (const [key, value] of Object.entries(data)) {
        if (SENSITIVE_ENV_KEYS.has(key))
            continue;
        allureData += `ENV.${key} = ${value}\n`;
    }
    return allureData;
};
exports.formatEnvData = formatEnvData;
/**
 * Sanitizes an error to remove circular references (e.g., from AxiosError objects).
 * This prevents Jest serialization failures when processing test results.
 * Always returns a clean Error object with only serializable properties.
 */
const sanitizeError = (error) => {
    if (!axios_1.default.isAxiosError(error)) {
        if (error instanceof Error) {
            // Create a new clean error to avoid any circular references
            const sanitized = new Error(error.message);
            sanitized.name = error.name;
            if (error.stack) {
                sanitized.stack = error.stack;
            }
            const runId = error.runId;
            if (typeof runId === "string") {
                Object.assign(sanitized, { runId });
            }
            return sanitized;
        }
        return new Error(String(error ?? "Unknown error"));
    }
    const err = error;
    const sanitized = new Error(err.message || "Axios request failed");
    Object.assign(sanitized, {
        name: err.name,
        code: err.code,
        url: err.config?.url,
        method: err.config?.method,
        status: err.response?.status,
    });
    return sanitized;
};
exports.sanitizeError = sanitizeError;
//# sourceMappingURL=index.js.map