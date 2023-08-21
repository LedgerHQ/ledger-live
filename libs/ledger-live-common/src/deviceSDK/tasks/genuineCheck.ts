// import type { DeviceId, DeviceInfo, FinalFirmware } from "@ledgerhq/types-live";
// import { Observable, from } from "rxjs";
// import { switchMap } from "rxjs/operators";

// import { getDeviceInfoTask } from "./getDeviceInfo";
// import ManagerAPI from "../../api/Manager";
// import { getProviderId } from "../../manager";
// import { withDevice } from "../../hw/deviceAccess";
// import { genuineCheckCommand } from "../commands/genuineCheck";

// export type GenuineCheckTaskArgs = { deviceId: DeviceId };
// export type GenuineCheckTaskEvent = any;

// export function genuineCheckTask({
//   deviceId,
// }: GenuineCheckTaskArgs): GenuineCheckTaskEvent {
//   let deviceInfo: DeviceInfo;
//   let firmware: FinalFirmware;

//   return new Observable((o) => {
//     // TODO: this getDeviceInfoTask should be called inside a genuineCheckAction, not here in the task
//     getDeviceInfoTask({ deviceId }).subscribe({
//       next: (event) => {
//         deviceInfo = event;
//       },
//       complete: () => {
//         // TODO: handle better
//         if (!deviceInfo) {
//           throw new Error("A device info should be provided");
//         }

//         from(
//           ManagerAPI.getDeviceVersion(
//             deviceInfo.targetId,
//             getProviderId(deviceInfo)
//           )
//         )
//           .pipe(
//             switchMap((deviceVersion) =>
//               from(
//                 ManagerAPI.getCurrentFirmware({
//                   deviceId: deviceVersion.id,
//                   version: deviceInfo.version,
//                   provider: getProviderId(deviceInfo),
//                 })
//               )
//             )
//           )
//           .subscribe({
//             next: (event) => {
//               firmware = event;
//             },
//             complete: () => {
//               if (!firmware) {
//                 throw new Error("A firmware info should be provided");
//               }

//               withDevice(deviceId)((transport) => {
//                 return genuineCheckCommand(transport, {
//                   targetId: deviceInfo.targetId,
//                   perso: firmware.perso,
//                 });
//               }).subscribe({
//                 next: (_event) => {},
//               });
//             },
//           });
//       },
//     });
//   });
// }
