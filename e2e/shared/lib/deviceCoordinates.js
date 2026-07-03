"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDeviceCoordinates = getDeviceCoordinates;
const devices_1 = require("@ledgerhq/devices");
const speculosAppVersion_1 = require("./speculosAppVersion");
const deviceCoordinatesMap = {
    settingsToggle1: {
        [devices_1.DeviceModelId.stax]: { x: 345, y: 136 },
        [devices_1.DeviceModelId.europa]: { x: 420, y: 140 },
        [devices_1.DeviceModelId.apex]: { x: 263, y: 100 },
    },
    settingsCogwheel: {
        [devices_1.DeviceModelId.stax]: { x: 362, y: 43 },
        [devices_1.DeviceModelId.europa]: { x: 400, y: 80 },
        [devices_1.DeviceModelId.apex]: { x: 253, y: 58 },
    },
    turnOnSync: {
        [devices_1.DeviceModelId.stax]: { x: 121, y: 532 },
        [devices_1.DeviceModelId.europa]: { x: 151, y: 446 },
        [devices_1.DeviceModelId.apex]: { x: 90, y: 301 },
    },
    ensArrowOpen: {
        [devices_1.DeviceModelId.stax]: { x: 360, y: 360 },
        [devices_1.DeviceModelId.europa]: { x: 426, y: 388 },
        [devices_1.DeviceModelId.apex]: { x: 272, y: 254 },
    },
    arrowBack: {
        [devices_1.DeviceModelId.stax]: { x: 40, y: 40 },
        [devices_1.DeviceModelId.europa]: { x: 44, y: 46 },
        [devices_1.DeviceModelId.apex]: { x: 30, y: 30 },
    },
};
function getDeviceCoordinates(key) {
    const model = (0, speculosAppVersion_1.getSpeculosModel)();
    const coords = deviceCoordinatesMap[key];
    const result = coords[model];
    if (!result) {
        throw new Error(`No coordinates defined for key "${key}" on device model "${model}"`);
    }
    return result;
}
//# sourceMappingURL=deviceCoordinates.js.map