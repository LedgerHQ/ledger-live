"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var invariant_1 = __importDefault(require("invariant"));
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var errors_1 = require("@ledgerhq/errors");
var Manager_1 = __importDefault(require("@ledgerhq/live-common/lib/api/Manager"));
var network_1 = __importDefault(require("@ledgerhq/live-common/lib/network"));
var env_1 = require("@ledgerhq/live-common/lib/env");
var provider_1 = require("@ledgerhq/live-common/lib/manager/provider");
var manager_1 = __importDefault(require("@ledgerhq/live-common/lib/manager"));
var deviceAccess_1 = require("@ledgerhq/live-common/lib/hw/deviceAccess");
var getDeviceInfo_1 = __importDefault(require("@ledgerhq/live-common/lib/hw/getDeviceInfo"));
var firmwareUpdate_prepare_1 = __importDefault(require("@ledgerhq/live-common/lib/hw/firmwareUpdate-prepare"));
var firmwareUpdate_main_1 = __importDefault(require("@ledgerhq/live-common/lib/hw/firmwareUpdate-main"));
var scan_1 = require("../scan");
var listFirmwareOSU = function () { return __awaiter(void 0, void 0, void 0, function () {
    var data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, network_1["default"])({
                    method: "GET",
                    url: "".concat((0, env_1.getEnv)("MANAGER_API_BASE"), "/firmware_osu_versions")
                })];
            case 1:
                data = (_a.sent()).data;
                return [2 /*return*/, data];
        }
    });
}); };
var customGetLatestFirmwareForDevice = function (deviceInfo, osuVersion) { return __awaiter(void 0, void 0, void 0, function () {
    var mcusPromise, deviceVersion, osu, data, final, mcus, currentMcuVersion, shouldFlashMCU;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                mcusPromise = Manager_1["default"].getMcus();
                return [4 /*yield*/, Manager_1["default"].getDeviceVersion(deviceInfo.targetId, (0, provider_1.getProviderId)(deviceInfo))];
            case 1:
                deviceVersion = _a.sent();
                if (!deviceInfo.isOSU) return [3 /*break*/, 3];
                return [4 /*yield*/, Manager_1["default"].getCurrentOSU({
                        deviceId: deviceVersion.id,
                        provider: (0, provider_1.getProviderId)(deviceInfo),
                        version: deviceInfo.version
                    })];
            case 2:
                osu = _a.sent();
                return [3 /*break*/, 5];
            case 3: return [4 /*yield*/, listFirmwareOSU()];
            case 4:
                data = _a.sent();
                osu = data.find(function (d) {
                    return d.device_versions.includes(deviceVersion.id) && d.name === osuVersion;
                });
                _a.label = 5;
            case 5:
                if (!osu) {
                    return [2 /*return*/, null];
                }
                return [4 /*yield*/, Manager_1["default"].getFinalFirmwareById(osu.next_se_firmware_final_version)];
            case 6:
                final = _a.sent();
                return [4 /*yield*/, mcusPromise];
            case 7:
                mcus = _a.sent();
                currentMcuVersion = mcus.find(function (mcu) { return mcu.name === deviceInfo.mcuVersion; });
                if (!currentMcuVersion)
                    throw new errors_1.UnknownMCU();
                shouldFlashMCU = !final.mcu_versions.includes(currentMcuVersion.id);
                return [2 /*return*/, {
                        final: final,
                        osu: osu,
                        shouldFlashMCU: shouldFlashMCU
                    }];
        }
    });
}); };
var disclaimer = "this is a developer feature that allow to flash anything, we are not responsible of your actions, by flashing your device you might reset your seed or block your device";
exports["default"] = {
    description: "Perform a firmware update",
    args: [
        scan_1.deviceOpt,
        {
            name: "to-my-own-risk",
            type: Boolean,
            desc: disclaimer
        },
        {
            name: "osuVersion",
            type: String,
            desc: "(to your own risk) provide yourself an OSU version to flash the device with"
        },
        {
            name: "listOSUs",
            type: Boolean,
            desc: "list all available OSUs (for all devices, beta and prod versions)"
        },
    ],
    job: function (_a) {
        var device = _a.device, osuVersion = _a.osuVersion, toMyOwnRisk = _a["to-my-own-risk"], listOSUs = _a.listOSUs;
        return ((0, invariant_1["default"])(!osuVersion || toMyOwnRisk, "--to-my-own-risk is required: " + disclaimer),
            listOSUs
                ? (0, rxjs_1.from)(listFirmwareOSU()).pipe((0, operators_1.mergeMap)(function (d) { return (0, rxjs_1.from)(d.map(function (d) { return d.name; })); }))
                : (0, deviceAccess_1.withDevice)(device || "")(function (t) { return (0, rxjs_1.from)((0, getDeviceInfo_1["default"])(t)); }).pipe((0, operators_1.mergeMap)(osuVersion
                    ? function (deviceInfo) {
                        return customGetLatestFirmwareForDevice(deviceInfo, osuVersion);
                    }
                    : manager_1["default"].getLatestFirmwareForDevice), (0, operators_1.mergeMap)(function (firmware) {
                    if (!firmware)
                        return (0, rxjs_1.of)("already up to date");
                    return (0, rxjs_1.concat)((0, rxjs_1.of)("firmware: ".concat(firmware.final.name, "\nOSU: ").concat(firmware.osu.name, " (hash: ").concat(firmware.osu.hash, ")")), (0, firmwareUpdate_prepare_1["default"])(device || "", firmware), (0, firmwareUpdate_main_1["default"])(device || "", firmware));
                })));
    }
};
//# sourceMappingURL=firmwareUpdate.js.map