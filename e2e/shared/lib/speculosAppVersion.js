"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSpeculosModel = getSpeculosModel;
exports.isTouchDevice = isTouchDevice;
exports.getNanoAppCatalog = getNanoAppCatalog;
exports.getDeviceFirmwareVersion = getDeviceFirmwareVersion;
exports.createNanoAppJsonFile = createNanoAppJsonFile;
exports.getNanoAppCatalogVersionMap = getNanoAppCatalogVersionMap;
exports.getAppVersionFromCatalog = getAppVersionFromCatalog;
const device_core_1 = require("@ledgerhq/device-core");
const live_env_1 = require("@ledgerhq/live-env");
const devices_1 = require("@ledgerhq/devices");
const Device_1 = require("./enum/Device");
const index_1 = require("./index");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const liveCommonVersion = "34.64.0"; // live-common version isn't really necessary here, so we can hardcode it
const nanoAppProviderId = 1;
function getSpeculosModel() {
    const speculosDevice = process.env.SPECULOS_DEVICE;
    switch (speculosDevice) {
        case Device_1.Device.LNS.name:
            return devices_1.DeviceModelId.nanoS;
        case Device_1.Device.LNX.name:
            return devices_1.DeviceModelId.nanoX;
        case Device_1.Device.STAX.name:
            return devices_1.DeviceModelId.stax;
        case Device_1.Device.FLEX.name:
        case devices_1.DeviceModelId.europa:
            return devices_1.DeviceModelId.europa;
        case Device_1.Device.NANO_GEN_5.name:
            return devices_1.DeviceModelId.apex;
        case Device_1.Device.LNSP.name:
        default:
            return devices_1.DeviceModelId.nanoSP;
    }
}
function isTouchDevice() {
    const model = getSpeculosModel();
    return (model === devices_1.DeviceModelId.stax || model === devices_1.DeviceModelId.europa || model === devices_1.DeviceModelId.apex);
}
function getDeviceTargetId(device) {
    const modelToTargetIdMap = {
        [devices_1.DeviceModelId.nanoS]: Device_1.Device.LNS.targetId,
        [devices_1.DeviceModelId.nanoX]: Device_1.Device.LNX.targetId,
        [devices_1.DeviceModelId.nanoSP]: Device_1.Device.LNSP.targetId,
        [devices_1.DeviceModelId.stax]: Device_1.Device.STAX.targetId,
        [devices_1.DeviceModelId.europa]: Device_1.Device.FLEX.targetId,
        [devices_1.DeviceModelId.apex]: Device_1.Device.NANO_GEN_5.targetId,
    };
    return modelToTargetIdMap[device];
}
async function getNanoAppCatalog(device, deviceFirmware) {
    const repository = new device_core_1.HttpManagerApiRepository((0, live_env_1.getEnv)("MANAGER_API_BASE"), liveCommonVersion);
    const targetId = getDeviceTargetId(device);
    return await repository.catalogForDevice({
        provider: nanoAppProviderId,
        targetId: targetId,
        firmwareVersion: deviceFirmware,
    });
}
const firmwareVersionCache = new Map();
async function getDeviceFirmwareVersion(device) {
    const configuredFirmwareVersion = process.env.SPECULOS_FIRMWARE_VERSION;
    if (configuredFirmwareVersion) {
        firmwareVersionCache.set(device, configuredFirmwareVersion);
        return configuredFirmwareVersion;
    }
    const cached = firmwareVersionCache.get(device);
    if (cached)
        return cached;
    const repository = new device_core_1.HttpManagerApiRepository((0, live_env_1.getEnv)("MANAGER_API_BASE"), liveCommonVersion);
    const deviceVersion = await repository.getDeviceVersion({
        targetId: getDeviceTargetId(device),
        providerId: nanoAppProviderId,
    });
    const firmwareIds = deviceVersion.se_firmware_final_versions;
    if (!Array.isArray(firmwareIds) || firmwareIds.length === 0) {
        throw new Error(`No firmware versions found for device  ${device}`);
    }
    const firmwares = await Promise.all(firmwareIds.map(id => repository.getFinalFirmwareById(id)));
    // Only firmwares matching providerId
    const providerFirmwares = firmwares.filter(fw => Array.isArray(fw.providers) && fw.providers.includes(nanoAppProviderId));
    if (providerFirmwares.length === 0) {
        throw new Error(`No firmware versions found for device version ${deviceVersion.id} for device ${device}`);
    }
    // Latest is chosen by highest numeric ID
    const firmware = providerFirmwares.reduce((latest, current) => current.id > latest.id ? current : latest);
    firmwareVersionCache.set(device, firmware.version);
    process.env.SPECULOS_FIRMWARE_VERSION = firmware.version;
    return firmware.version;
}
async function createNanoAppJsonFile(nanoAppFilePath) {
    const jsonFilePath = path.resolve(process.cwd(), nanoAppFilePath);
    try {
        if (fs.existsSync(jsonFilePath)) {
            return; // File already exists
        }
        fs.mkdirSync(path.dirname(jsonFilePath), { recursive: true });
        const device = getSpeculosModel();
        const firmware = await getDeviceFirmwareVersion(device);
        const appCatalog = await getNanoAppCatalog(device, firmware);
        const tmpPath = `${jsonFilePath}.${process.pid}.tmp`;
        fs.writeFileSync(tmpPath, JSON.stringify(appCatalog, null, 2), "utf8");
        try {
            fs.renameSync(tmpPath, jsonFilePath);
        }
        catch {
            try {
                fs.unlinkSync(tmpPath);
            }
            catch {
                // ignore
            }
        }
    }
    catch (error) {
        console.error("Unable to create app version file:", (0, index_1.sanitizeError)(error));
    }
}
async function getNanoAppCatalogVersionMap(nanoAppFilePath) {
    const jsonFilePath = path.resolve(process.cwd(), nanoAppFilePath);
    try {
        await createNanoAppJsonFile(nanoAppFilePath);
        if (!fs.existsSync(jsonFilePath)) {
            console.error(`Catalog file not found: ${jsonFilePath}`);
            return new Map();
        }
        const raw = fs.readFileSync(jsonFilePath, "utf8");
        const catalog = JSON.parse(raw);
        return new Map(catalog.map(entry => [entry.versionDisplayName, entry.version]));
    }
    catch (error) {
        console.error("Unable to get app versions from catalog:", error);
    }
    return new Map();
}
async function getAppVersionFromCatalog(currency, nanoAppFilePath) {
    try {
        const catalogVersions = await getNanoAppCatalogVersionMap(nanoAppFilePath);
        return catalogVersions.get(currency) ?? "";
    }
    catch (error) {
        console.error(`Unable to get app version for ${currency} from catalog:`, error);
    }
}
//# sourceMappingURL=speculosAppVersion.js.map