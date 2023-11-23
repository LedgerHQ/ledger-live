const intParser = (v: any): number | undefined => {
    if (!Number.isNaN(v)) return parseInt(v, 10);
};
  
const floatParser = (v: any): number | undefined => {
    if (!Number.isNaN(v)) return parseFloat(v);
};
  
const boolParser = (v: unknown): boolean | undefined => {
    if (typeof v === "boolean") return v;
    return !(v === "0" || v === "false");
};
  
const stringParser = (v: unknown): string | undefined => (typeof v === "string" ? v : undefined);  

const configDefaultValues = {
    key1: {
      description: "this is key1",
      parser: intParser,
      value: 1,
    },
    key2: {
        description: "this is key2",
        parser: stringParser,
        value: "2234ffdafs",
    },
    key3: {
        description: "this is key3",
        parser: floatParser,
        value: "2.9",
    },
    key4: {
        description: "this is key4",
        parser: boolParser,
        value: true,
    },
}
