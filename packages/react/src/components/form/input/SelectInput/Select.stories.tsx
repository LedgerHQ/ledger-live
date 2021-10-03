import React from "react";
import { OptionProps, ValueContainerProps } from "react-select";
import Text from "@components/asorted/Text";
import Flex from "@components/layout/Flex";
import SearchMedium from "@assets/icons/SearchMedium";
import SelectInput, { Props } from "./index";
import { Option } from "./Option";
import { VirtualMenuList } from "./VirtualMenuList";
import { ValueContainer } from "./ValueContainer";
import { useTheme } from "styled-components";

export default {
  title: "Form/Input/SelectInput",
  component: SelectInput,
  argTypes: {
    value: { table: { disable: true } },
    renderLeft: { table: { disable: true } },
    renderRight: { table: { disable: true } },
    rowHeight: { table: { disable: true } },
    isDisabled: { type: "boolean" },
    error: { type: "string" },
    menuIsOpen: { type: "boolean" },
  },
};

const options = [
  { value: "chocolate", label: "Chocolate" },
  { value: "strawberry", label: "Strawberry" },
  { value: "lemon", label: "Lemon" },
  { value: "vanilla", label: "Vanilla" },
];

const cssColors = [
  "aliceblue",
  "antiquewhite",
  "aqua",
  "aquamarine",
  "azure",
  "beige",
  "bisque",
  "black",
  "blanchedalmond",
  "blue",
  "blueviolet",
  "brown",
  "burlywood",
  "cadetblue",
  "chartreuse",
  "chocolate",
  "coral",
  "cornflowerblue",
  "cornsilk",
  "crimson",
  "cyan",
  "darkblue",
  "darkcyan",
  "darkgoldenrod",
  "darkgray",
  "darkgreen",
  "darkgrey",
  "darkkhaki",
  "darkmagenta",
  "darkolivegreen",
  "darkorange",
  "darkorchid",
  "darkred",
  "darksalmon",
  "darkseagreen",
  "darkslateblue",
  "darkslategray",
  "darkslategrey",
  "darkturquoise",
  "darkviolet",
  "deeppink",
  "deepskyblue",
  "dimgray",
  "dimgrey",
  "dodgerblue",
  "firebrick",
  "floralwhite",
  "forestgreen",
  "fuchsia",
  "gainsboro",
  "ghostwhite",
  "gold",
  "goldenrod",
  "gray",
  "green",
  "greenyellow",
  "grey",
  "honeydew",
  "hotpink",
  "indianred",
  "indigo",
  "ivory",
  "khaki",
  "lavender",
  "lavenderblush",
  "lawngreen",
  "lemonchiffon",
  "lightblue",
  "lightcoral",
  "lightcyan",
  "lightgoldenrodyellow",
  "lightgray",
  "lightgreen",
  "lightgrey",
  "lightpink",
  "lightsalmon",
  "lightseagreen",
  "lightskyblue",
  "lightslategray",
  "lightslategrey",
  "lightsteelblue",
  "lightyellow",
  "lime",
  "limegreen",
  "linen",
  "magenta",
  "maroon",
  "mediumaquamarine",
  "mediumblue",
  "mediumorchid",
  "mediumpurple",
  "mediumseagreen",
  "mediumslateblue",
  "mediumspringgreen",
  "mediumturquoise",
  "mediumvioletred",
  "midnightblue",
  "mintcream",
  "mistyrose",
  "moccasin",
  "navajowhite",
  "navy",
  "oldlace",
  "olive",
  "olivedrab",
  "orange",
  "orangered",
  "orchid",
  "palegoldenrod",
  "palegreen",
  "paleturquoise",
  "palevioletred",
  "papayawhip",
  "peachpuff",
  "peru",
  "pink",
  "plum",
  "powderblue",
  "purple",
  "red",
  "rosybrown",
  "royalblue",
  "saddlebrown",
  "salmon",
  "sandybrown",
  "seagreen",
  "seashell",
  "sienna",
  "silver",
  "skyblue",
  "slateblue",
  "slategray",
  "slategrey",
  "snow",
  "springgreen",
  "steelblue",
  "tan",
  "teal",
  "thistle",
  "tomato",
  "turquoise",
  "violet",
  "wheat",
  "white",
  "whitesmoke",
  "yellow",
  "yellowgreen",
];

type SelectItem = { label: string; value: string };

const colorOptions = cssColors.map((color) => ({ label: color, value: color }));
const ColorOption = (props: OptionProps<SelectItem, false>) => {
  return (
    <Option
      {...props}
      render={({ children }) => (
        <Flex flex={1}>
          <Flex mr={4} p={4} style={{ background: props.data.value }} />
          <Flex flex={1}>{children}</Flex>
        </Flex>
      )}
    />
  );
};
const ColorValueContainer = (props: ValueContainerProps<SelectItem, false>) => {
  return (
    <ValueContainer
      render={({ children }) => <div style={{ textTransform: "capitalize" }}>{children}</div>}
      {...props}
    />
  );
};
export const Default = (args: Props): React.ReactNode => {
  const [value, setValue] = React.useState<SelectItem>();

  return (
    <SelectInput
      options={colorOptions}
      value={value}
      onChange={setValue}
      placeholder="Pick a color"
      isClearable
      isOptionDisabled={(option) => option.value.startsWith("b")}
      components={{ Option: ColorOption, ValueContainer: ColorValueContainer }}
      renderLeft={(_) => value && <Flex mr={4} p={4} style={{ background: value.value }} />}
      {...args}
    />
  );
};

export const Minimal = (args: Props): React.ReactNode => {
  const [value, setValue] = React.useState(null);

  return <SelectInput options={options} value={value} onChange={setValue} {...args} />;
};

export const SideRenders = (args: Props): React.ReactNode => {
  const [value, setValue] = React.useState(null);
  const theme = useTheme();

  return (
    <SelectInput
      options={options}
      value={value}
      onChange={setValue}
      renderLeft={(props) => (
        <Flex mr={3}>
          <SearchMedium
            color={props.isDisabled ? "currentColor" : theme["colors"].palette.neutral.c70}
          />
        </Flex>
      )}
      renderRight={() => (
        <Text mr={4} ff="Inter|SemiBold" fontSize={4} color="inherit">
          #Right
        </Text>
      )}
      {...args}
    />
  );
};

const CustomOption = (props: OptionProps<SelectItem, false>) => {
  return (
    <Option
      {...props}
      render={({ children }) => (
        <Flex flex={1}>
          <Text ff="Inter|SemiBold" fontSize={3} mr={4}>
            #Left
          </Text>
          <Flex flex={1} justifyContent="space-between">
            {children}
            <Text ff="Inter|SemiBold" fontSize={3} color="inherit">
              #Right
            </Text>
          </Flex>
        </Flex>
      )}
    />
  );
};
export const CustomOptions = (args: Props): React.ReactNode => {
  const [value, setValue] = React.useState(null);

  return (
    <SelectInput
      options={options}
      value={value}
      onChange={setValue}
      components={{ Option: CustomOption }}
      {...args}
    />
  );
};

export const DisabledOption = (args: Props): React.ReactNode => {
  const [value, setValue] = React.useState(null);

  return (
    <SelectInput
      options={options}
      value={value}
      onChange={setValue}
      isOptionDisabled={(option) => option.value === "lemon"}
      {...args}
    />
  );
};

const hugeOptions = new Array(10000).fill(0).map((_, i) => ({ label: "" + i, value: "" + i }));
export const VirtualList = (args: Props): React.ReactNode => {
  const [value, setValue] = React.useState(null);

  return (
    <SelectInput
      options={hugeOptions}
      value={value}
      onChange={setValue}
      components={{
        MenuList: VirtualMenuList,
      }}
      {...args}
    />
  );
};
