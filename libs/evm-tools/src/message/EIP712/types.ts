export type MessageFilters = {
  contractName: {
    label: string;
    signature: string;
  };
  fields: {
    label: string;
    path: string;
    signature: string;
  }[];
};
