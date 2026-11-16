export const SEP = ":";

type DescriptorFields = {
  purpose: string;
  version: string;
  type: string;
  network: string;
  key: string;
  path: string;
};

export function formatDescriptorFields(fields: DescriptorFields): string {
  const { purpose, version, type, network, key, path } = fields;
  return [purpose, version, type, network, key, path].join(SEP);
}
