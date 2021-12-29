import React from "react";
import Flex from "../../layout/Flex";
import Box from "../../layout/Box";
import Text from "../../asorted/Text";
import DropdownGenericComponent, { Props as DropdownGenericProps } from ".";
import Divider from "../../asorted/Divider";

const SmallChild = () => (
  <Flex padding={10} backgroundColor="neutral.c30" justifyContent="center" alignItems="center">
    <Text variant="small" color="palette.neutral.c60" textAlign="center">
      I'm a simple div with a grey background and no margin passed as children of the dropdown
      component
    </Text>
  </Flex>
);

const BigChild = () => (
  <Box
    padding={10}
    flexDirection="column"
    width="300px"
    backgroundColor="neutral.c30"
    justifyContent="center"
    alignItems="center"
  >
    <Text maxWidth="200px" variant="small" color="palette.neutral.c60" textAlign="center">
      If you put content that is bigger than the available space, the dropdown will have a maxHeight
      and its inner container will scroll
    </Text>
    <Box height="100px" width="100px" backgroundColor="lightgreen" />
    <Box height="120px" width="100px" backgroundColor="lightcoral" />
    <Box height="200px" width="100px" backgroundColor="lightblue" />
    <Box height="120px" width="100px" backgroundColor="lightcoral" />
  </Box>
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
  props: Omit<DropdownGenericProps, "children"> & {
    big?: boolean;
    containerProps: Record<string, unknown>;
  },
) => {
  const { containerProps = {}, big = false, ...rest } = props;
  return (
    <Flex flexDirection="column" {...containerProps}>
      <DropdownGenericComponent {...rest}>
        {big ? <BigChild /> : <SmallChild />}
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
      <Text variant="h3">Small content:</Text>
      {DropdownStoryTemplate({ ...args, containerProps: { alignItems: "flex-start" } })}
      {DropdownStoryTemplate({ ...args, containerProps: { alignItems: "center" } })}
      {DropdownStoryTemplate({ ...args, containerProps: { alignItems: "flex-end" } })}
      <Divider variant="light" />
      <Text variant="h3">Big content:</Text>
      {DropdownStoryTemplate({ ...args, big: true, containerProps: { alignItems: "flex-start" } })}
      {DropdownStoryTemplate({ ...args, big: true, containerProps: { alignItems: "center" } })}
      {DropdownStoryTemplate({ ...args, big: true, containerProps: { alignItems: "flex-end" } })}
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
    flipDisabled: { type: "boolean", defaultValue: false },
  },
};
