import React from "react";
import Flex from "../../layout/Flex";
import Text from "../../asorted/Text";
import DropdownGenericComponent, { Props as DropdownGenericProps } from ".";

const ChildrenExample = () => (
  <Flex
    height={200}
    width={180}
    padding={10}
    backgroundColor="neutral.c30"
    justifyContent="center"
    alignItems="center"
  >
    <Text variant="small" color="palette.neutral.c60" textAlign="center">
      I'm a simple div with a grey background and no margin passed as children of the dropdown
      component
    </Text>
  </Flex>
);

const BottomPlaceholder = () => (
  <Flex
    width="100%"
    height="100px"
    backgroundColor="neutral.c30"
    justifyContent="center"
    alignItems="center"
    padding={20}
  >
    <Text variant="small" color="palette.neutral.c50" textAlign="center">
      Ignore me, I'm just an item placed below to illustrate that the dropdown is a floating
      component
    </Text>
  </Flex>
);

const DropdownStoryTemplate = (
  props: Omit<DropdownGenericProps, "children"> & { containerProps: Record<string, unknown> },
) => {
  const { containerProps = {}, ...rest } = props;
  return (
    <Flex flexDirection="column" {...containerProps}>
      <DropdownGenericComponent {...rest}>
        <ChildrenExample />
      </DropdownGenericComponent>
      <BottomPlaceholder />
    </Flex>
  );
};

export const DropdownGeneric = (args: DropdownGenericProps): React.ReactNode => {
  return (
    <Flex flexDirection="column" rowGap={5}>
      {/**
       * Calling DropdownTemplate as a function here to trick storybook into displaying
       * the actual code in "show code" instead of an opaque "DropdownTemplate" component
       *  */}
      {DropdownStoryTemplate({ ...args, containerProps: { alignItems: "flex-start" } })}
      {DropdownStoryTemplate({ ...args, containerProps: { alignItems: "center" } })}
      {DropdownStoryTemplate({ ...args, containerProps: { alignItems: "flex-end" } })}
      {DropdownStoryTemplate({ ...args, containerProps: { alignItems: "flex-start" } })}
      {DropdownStoryTemplate({ ...args, containerProps: { alignItems: "center" } })}
      {DropdownStoryTemplate({ ...args, containerProps: { alignItems: "flex-end" } })}
    </Flex>
  );
};

export default {
  title: "Form/SelectAndDialogs",
  component: DropdownGenericComponent,
  argTypes: {
    label: { type: "string", defaultValue: "Label" },
    placement: { control: { type: "select", defaultValue: "bottom" } },
    closeOnClickOutside: { type: "boolean", defaultValue: true },
    closeOnClickInside: { type: "boolean", defaultValue: false },
    disabled: { type: "boolean", defaultValue: false },
  },
};
