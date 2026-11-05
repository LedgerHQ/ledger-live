export const SEP = ":";

type DescriptorFields = {
  purpose: string;
  version: string;
  type: string;
  network: string;
  subject: string;
  path: string;
};

export function formatDescriptorFields(fields: DescriptorFields): string {
  const { purpose, version, type, network, subject, path } = fields;
  return [purpose, version, type, network, subject, path].join(SEP);
}
