import React from "react";
import { useTheme } from "styled-components";
import { OptionProps, ValueContainerProps } from "react-select";

import Text from "../../asorted/Text";
import Flex from "../../layout/Flex";
import Grid from "../../layout/Grid";
import SearchMedium from "@ledgerhq/icons-ui/react/SearchMedium";
import SelectInput, { Props } from "./index";
import { Option } from "./Option";
import { VirtualMenuList } from "./VirtualMenuList";
import { ValueContainer } from "./ValueContainer";
import { StoryTemplate } from "../../helpers";

const description = `
### A styled Select Input control

> This component is based on [react-select](https://react-select.com/). Please refer to the [documentation](https://react-select.com/props) for an exhaustive list of available props.

## Usage

\`\`\`jsx

import { SelectInput } from "@ledgerhq/react-ui"

\`\`\`

Basically the component accepts a list of selectable options and a callback.

\`\`\`jsx
// Minimal working example

const [value, setValue] = React.useState()
const options = [
  { value: "chocolate", label: "Chocolate" },
  { value: "strawberry", label: "Strawberry" },
  { value: "vanilla", label: "Vanilla" },
]

<SelectInput
  options={options}
  value={value}
  onChange={setValue}
/>
\`\`\`

## Portaling

The opened menu is not rendered inside a portal by default.

- Use the \`menuPortalTarget\` [prop](https://react-select.com/advanced#portaling) to specify a node to root the portal.
- To specify a custom z-index you will need to override the \`menuPortal\` style.

\`\`\`jsx
<SelectInput
  menuPortalTarget={document.body}
  styles={{ menuPortal: (provided) => ({ ...provided, zIndex: 2 }) }}
/>
\`\`\`

## Extending Styles

react-select has built in support for [overriding styles](https://react-select.com/styles#provided-styles-and-state).

#### Using the \`extendStyles\` props

SelectInput contains custom built-in styles to integrate the select control with the rest of the Ledger design.

The \`extendStyles\` prop is a function that will allow you to compose new styles.
The function argument is a map between the react-select provided styles and additional ones.

\`\`\`jsx
/*
  The "styles" argument is an object containing component names as keys and functions as values.
  These functions take as arguments the styles provided by react-select and return an object of additional styles.
*/
const extendStyles = (styles) => ({
  ...styles,
  menuPortal: (provided) => {
    return {
      // "styles.menuPortal" will exist if SelectInput has custom styles for this component.
      // Otherwise, use the react-select provided ones.
      ...((styles.menuPortal && styles.menuPortal(provided)) || { ...provided }),
      // Then extend the output with your own styles!
      zIndex: 2,
    };
  },
});

<SelectInput extendStyles={extendStyles} />
\`\`\`

#### Using the \`styles\` prop

To completely override the SelectInput styles, use the \`style\` prop.

\`\`\`jsx
// The "provided" argument will only contain the base react-select styles.
const styles = { menuPortal: (provided) => ({ ...provided, zIndex: 2 }) }

<SelectInput styles={styles} />
\`\`\`

## Extending Components

react-select has built in support for [extending components](https://react-select.com/components).

To override components use the \`components\` prop:

\`\`\`jsx

<SelectInput components={{ Option: ColorOption, ValueContainer: ColorValueContainer }} />

\`\`\`

If you would like to re-use inner SelectInput components you can import them like so:

\`\`\`jsx
// Import them as modules
import * as DropdownIndicatorModule from "@ledgerhq/react-ui/components/form/SelectInput/DropdownIndicator";
import * as ValueContainerModule from "@ledgerhq/react-ui/components/form/SelectInput/ValueContainer";
import * as ControlModule from "@ledgerhq/react-ui/components/form/SelectInput/Control";
import * as MenuListModule from "@ledgerhq/react-ui/components/form/SelectInput/MenuList";
import * as OptionModule from "@ledgerhq/react-ui/components/form/SelectInput/Option";

// Then each module contains the component definition and the associated style
const { DropdownIndicator, getStyles } = DropdownIndicatorModule

<SelectInput
  components={{dropdownIndicator: DropdownIndicator}}
  styles={{dropdownIndicator: getStyles}}
/>
\`\`\`

## Sandbox

The following advanced example showcases how to override components and styles and disable elements.
`;

export default {
  title: "Form/Input/Select",
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
  parameters: {
    docs: {
      description: { component: description },
    },
  },
};

const options = [
  // Labels contain muttons spaces (U+2003 character).
  // Do not replace with a regular space please!
  { value: "chocolate", label: "🍫 Chocolate" },
  { value: "strawberry", label: "🍓 Strawberry" },
  { value: "lemon", label: "🍋 Lemon" },
  { value: "vanilla", label: "🍦 Vanilla" },
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
        <Flex flex={1} py={2} alignItems="center">
          <Flex mr={4} p={4} style={{ background: props.data.value }} />
          <Flex flex={1} style={{ textTransform: "capitalize" }}>
            {children}
          </Flex>
        </Flex>
      )}
    />
  );
};
const ColorValueContainer = (props: ValueContainerProps<SelectItem, false>) => {
  return (
    <ValueContainer
      render={({ children }) => (
        <Grid alignItems="center" style={{ textTransform: "capitalize" }}>
          {children}
        </Grid>
      )}
      {...props}
    />
  );
};

export const Default: StoryTemplate<Props<SelectItem>> = (args) => {
  const [value, setValue] = React.useState<SelectItem | null>(null);

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
      menuPortalTarget={document.body}
      styles={{ menuPortal: (provided) => ({ ...provided, zIndex: 2 }) }}
      {...args}
    />
  );
};

export const Minimal: StoryTemplate<Props<SelectItem>> = (args) => {
  const [value, setValue] = React.useState<SelectItem | null>(null);

  return (
    <SelectInput
      options={options}
      value={value}
      onChange={setValue}
      menuPortalTarget={document.body}
      {...args}
    />
  );
};

Minimal.parameters = {
  docs: {
    description: {
      story: "This is a minimal working example with only required props.",
    },
  },
};

export const SideRenders: StoryTemplate<Props<SelectItem>> = (args) => {
  const [value, setValue] = React.useState<SelectItem | null>(null);
  const theme = useTheme();

  return (
    <SelectInput
      options={options}
      value={value}
      onChange={setValue}
      renderLeft={(props) => (
        <Flex mr={3}>
          <SearchMedium color={props.isDisabled ? "currentColor" : theme.colors.neutral.c70} />
        </Flex>
      )}
      renderRight={() => (
        <Text mr={4} fontWeight="semiBold" variant={"body"} color="inherit">
          #Right
        </Text>
      )}
      menuPortalTarget={document.body}
      {...args}
    />
  );
};

SideRenders.parameters = {
  docs: {
    description: {
      story:
        "This example has side renders - a magnifying glass icon on the left and custom label on the right.",
    },
  },
};

const CustomOption = (props: OptionProps<SelectItem, false>) => {
  return (
    <Option
      {...props}
      render={({ children }) => (
        <Flex flex={1} alignItems="center">
          <Text fontWeight="semiBold" variant={"paragraph"} mr={4}>
            #Left
          </Text>
          <Flex flex={1} justifyContent="space-between">
            {children}
            <Text fontWeight="semiBold" variant={"paragraph"} color="inherit">
              #Right
            </Text>
          </Flex>
        </Flex>
      )}
    />
  );
};
export const CustomOptions: StoryTemplate<Props<SelectItem>> = (args) => {
  const [value, setValue] = React.useState<SelectItem | null>();

  return (
    <SelectInput
      options={options}
      value={value}
      onChange={setValue}
      components={{ Option: CustomOption }}
      menuPortalTarget={document.body}
      {...args}
    />
  );
};

CustomOptions.parameters = {
  docs: {
    description: {
      story: "Here the `Option` component is overriden to display side labels (#Left and #Right).",
    },
  },
};

export const DisabledOption: StoryTemplate<Props<SelectItem>> = (args) => {
  const [value, setValue] = React.useState<SelectItem | null>(null);

  return (
    <SelectInput
      options={options}
      value={value}
      onChange={setValue}
      isOptionDisabled={(option) => option.value === "lemon"}
      menuPortalTarget={document.body}
      {...args}
    />
  );
};

DisabledOption.parameters = {
  docs: {
    description: {
      story:
        "Using the `isOptionDisabled` prop, options having a value that matches 'lemon' are disabled.",
    },
  },
};

const hugeOptions = new Array(10000).fill(0).map((_, i) => ({ label: "" + i, value: "" + i }));
export const VirtualList: StoryTemplate<Props<SelectItem>> = (args) => {
  const [value, setValue] = React.useState<SelectItem | null>(null);

  return (
    <SelectInput
      options={hugeOptions}
      value={value}
      onChange={setValue}
      components={{
        MenuList: VirtualMenuList,
      }}
      menuPortalTarget={document.body}
      {...args}
    />
  );
};

VirtualList.parameters = {
  docs: {
    description: {
      story:
        "This control contains a list of 10_000 elements. It uses the `VirtualMenuList` component to render the list inside a `react-window` wrapper.",
    },
  },
};

export const MultiSelect: StoryTemplate<Props<SelectItem, true>> = (args) => {
  const [value, setValue] = React.useState<readonly SelectItem[]>([]);

  return (
    <SelectInput
      isMulti
      options={options}
      value={value}
      onChange={setValue}
      menuPortalTarget={document.body}
      {...args}
    />
  );
};

MultiSelect.parameters = {
  docs: {
    description: {
      story: "A standard selector with multiselection using the `isMulti` prop.",
    },
  },
};
