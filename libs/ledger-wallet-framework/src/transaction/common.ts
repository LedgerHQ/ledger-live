type tooltipArgs = Record<string, string>;
export type CommonDeviceTransactionField =
  | {
      type: "amount";
      label: string;
      value?: string;
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
      /** When set, `value` is treated as a plain display string and this key is used for i18n lookup instead. */
      valueI18nKey?: string;
      tooltipI18nKey?: string;
      tooltipI18nArgs?: tooltipArgs;
    };
