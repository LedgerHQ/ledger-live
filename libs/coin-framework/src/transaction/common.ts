type tooltipArgs = Record<string, string>;
export type CommonDeviceTransactionField =
  | {
      type: "amount";
      label: string;
    }
  | {
      type: "address";
      label: string;
      address: string;
    }
  | {
      type: "fees";
      label: string;
    }
  | {
      type: "text";
      label: string;
      value: string;
      tooltipI18nKey?: string;
      tooltipI18nArgs?: tooltipArgs;
    };
