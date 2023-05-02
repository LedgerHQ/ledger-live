import React from "react";
import Flex from "../../layout/Flex";
import Box from "../../layout/Box";
import Text from "../../asorted/Text";
import Alert from "../../message/Alert";
import DropdownGenericComponent, { Props as DropdownGenericProps } from ".";
import Divider from "../../asorted/Divider";

const SmallChild = () => (
  <Flex
    height={200}
    width={180}
    padding={10}
    backgroundColor="neutral.c30"
    justifyContent="center"
    alignItems="center"
  >
    <Text variant="small" color="neutral.c60" textAlign="center">
      I'm a simple div with a grey background and no margin passed as children of the dropdown
      component.
    </Text>
  </Flex>
);

const BigChild = ({ containerProps }: { containerProps?: Record<string, unknown> }) => (
  <Box
    padding={10}
    flexDirection="column"
    width="300px"
    justifyContent="center"
    alignItems="center"
    {...containerProps}
  >
    <Text variant="small" color="neutral.c60" textAlign="center">
      If the children node of the dropdown is bigger than the available space, the dropdown will
      restrict its own height to avoid overflowing and its inner container will scroll.
    </Text>
    <Box height="100px" width="100%" backgroundColor="primary.c100" />
    <Box height="100px" width="100%" backgroundColor="primary.c90" />
    <Box height="100px" width="100%" backgroundColor="primary.c80" />
    <Box height="100px" width="100%" backgroundColor="primary.c70" />
    <Box height="100px" width="100%" backgroundColor="primary.c60" />
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
    bigWithMaxHeight?: boolean;
    containerProps: Record<string, unknown>;
  },
) => {
  const { containerProps = {}, big = false, bigWithMaxHeight = false, ...rest } = props;
  return (
    <Flex flexDirection="column" {...containerProps}>
      <DropdownGenericComponent {...rest}>
        {big ? (
          bigWithMaxHeight ? (
            <BigChild containerProps={{ maxHeight: "400px", overflow: "scroll" }} />
          ) : (
            <BigChild />
          )
        ) : (
          <SmallChild />
        )}
      </DropdownGenericComponent>
      <BottomPlaceholder />
    </Flex>
  );
};

export const DropdownGeneric = (args: DropdownGenericProps): React.ReactNode => {
  const alignItemsPossibilities = ["flex-start", "center", "flex-end"];
  const containerPropsPossibilities = alignItemsPossibilities.map((alignItems) => ({ alignItems }));
  return (
    <Flex flexDirection="column" rowGap={5}>
      {/**
       * Calling DropdownTemplate as a function here to trick storybook into displaying
       * the actual code in "show code" instead of an opaque "DropdownTemplate" component
       *  */}
      <Text variant="h5">Small content:</Text>
      {containerPropsPossibilities.map((containerProps) =>
        DropdownStoryTemplate({ ...args, containerProps }),
      )}
      <Divider />
      <Text variant="h5">Big content:</Text>
      {containerPropsPossibilities.map((containerProps) =>
        DropdownStoryTemplate({ ...args, big: true, containerProps }),
      )}
      <Divider />
      <Text variant="h5">Big content (max height on child)</Text>
      <Alert
        type="info"
        title="In the following examples, the component passed as a child has its own internal maxHeight
        setup"
      ></Alert>
      {containerPropsPossibilities.map((containerProps) =>
        DropdownStoryTemplate({ ...args, big: true, bigWithMaxHeight: true, containerProps }),
      )}
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
