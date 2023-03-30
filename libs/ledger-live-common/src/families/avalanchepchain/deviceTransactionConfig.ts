import type { DeviceTransactionField } from "../../transaction";

export type ExtraDeviceTransactionField =
  | {
      type: "avalanchepchain.validatorName";
      label: string;
    }
  | {
      type: "avalanchepchain.validatorAmount";
      label: string;
    }
  | {
      type: "avalanchepchain.stakeStart";
      label: string;
    }
  | {
      type: "avalanchepchain.stakeEnd";
      label: string;
    };

function getDeviceTransactionConfig(): Array<DeviceTransactionField> {
  const fields: Array<DeviceTransactionField> = [];

  fields.push({
    type: "text",
    label: "Sign",
    value: "Add Delegator",
  });
  fields.push({
    type: "avalanchepchain.validatorName",
    label: "Validator",
  });
  fields.push({
    type: "avalanchepchain.stakeStart",
    label: "Start Time",
  });
  fields.push({
    type: "avalanchepchain.stakeEnd",
    label: "End Time",
  });
  fields.push({
    type: "avalanchepchain.validatorAmount",
    label: "Total Stake",
  });

  return fields;
}

export default getDeviceTransactionConfig;
