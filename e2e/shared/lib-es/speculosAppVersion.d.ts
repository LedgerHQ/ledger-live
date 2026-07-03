import { ApplicationV2Entity } from "@ledgerhq/device-core";
import { DeviceModelId } from "@ledgerhq/devices";
export declare function getSpeculosModel(): DeviceModelId;
export declare function isTouchDevice(): boolean;
export declare function getNanoAppCatalog(device: DeviceModelId, deviceFirmware: string): Promise<ApplicationV2Entity[]>;
export declare function getDeviceFirmwareVersion(device: DeviceModelId): Promise<string>;
export declare function createNanoAppJsonFile(nanoAppFilePath: string): Promise<void>;
export declare function getNanoAppCatalogVersionMap(nanoAppFilePath: string): Promise<Map<string, string>>;
export declare function getAppVersionFromCatalog(currency: string, nanoAppFilePath: string): Promise<string | undefined>;
//# sourceMappingURL=speculosAppVersion.d.ts.map