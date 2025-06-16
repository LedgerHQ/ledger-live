type Options =
  | { name: string; type: StringConstructor; desc: string }
  | { name: string; type: StringConstructor; desc: string; multiple: boolean };

const options: Array<Options> = [
  {
    name: "mode",
    type: String,
    desc: "mode of transaction: send",
  },
];

export type CliTools = {
  options: Array<Options>;
};

export default function makeCliTools(): CliTools {
  return {
    options,
  };
}
