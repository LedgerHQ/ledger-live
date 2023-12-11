import React from "react";
// @ts-expect-error Typings…
import { useArgs } from "@storybook/client-api";
import { action } from "@storybook/addon-actions";

import Popin, { PopinProps } from "./index";
import Text from "../../asorted/Text";
import Button from "../../cta/Button";
import theme from "../../../styles/theme";

const description = `
### This is a customizable pop-in component.

The component exports by default the container that defines how the component should be animated during the mount/unmount process.<br />
In addition to that, 3 different sections *(header, body and footer)* of the component are already designed and attached to the Popin default component.<br />

## Usage

\`\`\`js

import { Popin } from "@ledgerhq/react-ui"

\`\`\`

From the default Popin component, you can access 3 different pre-styled sections *(\`Popin.Header\`, \`Popin.Body\` and \`Popin.Footer\`)*. \
All of these components are optional.

- \`Popin.Header\` is accepting an onClose callback. The cross icon is only rendered if the onClose callback is provided
- \`Popin.Body\` is just a customizable scrollable Flex component configured to take all the available space
- \`Popin.Footer\` is a customizable Flex component

## Sandbox

Placement, style and content can be customized using props as demonstrated in the following example.<br />
Additionally, the story provide some playground options to play with the component. These options aren't \
props of the component itself.
`;

const code = `
<Popin isOpen={isOpen}>
  <Popin.Header onClose={onBack} onClose={onBack}><Text variant="h5">A title</Text></Popin.Header>
  <Popin.Body><Text variant="paragraph">Some texts here</Text></Popin.Body>
  <Popin.Footer>
    <Button type="main" onClick={onClick}>
      Next
    </Button>
  </Popin.Footer>
</Popin>
`;

export default {
  title: "Layout/Popin",
  component: Popin,
  parameters: {
    docs: {
      description: { component: description },
      source: { code, type: "code" },
    },
  },
  argTypes: {
    /** PROPS **/
    width: {
      type: "number",
      description: "Optional popin's width",
      control: {
        type: "number",
        min: theme.sizes.drawer.popin.min.width,
        max: theme.sizes.drawer.popin.max.width,
      },
      table: {
        type: {
          summary: "Accepted range",
          detail: `Value lower than ${theme.sizes.drawer.popin.min.width}px or greather than ${theme.sizes.drawer.popin.max.width}px will have no effect because of min/max css rules.`,
        },
        defaultValue: {
          summary: theme.sizes.drawer.popin.min.width,
        },
      },
    },
    height: {
      type: "number",
      description: "Optional popin's height",
      control: {
        type: "number",
        min: theme.sizes.drawer.popin.min.height,
        max: theme.sizes.drawer.popin.max.height,
      },
      table: {
        type: {
          summary: "Accepted range",
          detail: `Value lower than ${theme.sizes.drawer.popin.min.height}px or greather than ${theme.sizes.drawer.popin.max.height}px will have no effect because of min/max css rules.`,
        },
        defaultValue: {
          summary: theme.sizes.drawer.popin.min.height,
        },
      },
    },
    isOpen: {
      type: "boolean",
      description: "Controls if the popin is mounted or not.",
      required: true,
      control: { type: "boolean" },
    },
    onClose: {
      description:
        "Unmount the component when the user click on the cross icon. This props controls if the cross icon should be rendered inside the header component.",
      control: false,
    },

    /** playground **/
    hasHeader: {
      type: "boolean",
      value: true,
      description: "Controls if the header should be displayed.",
      required: true,
      control: { type: "boolean" },
      table: { category: "playground" },
    },
    hasFooter: {
      type: "boolean",
      value: true,
      description: "Controls if the footer should be displayed.",
      required: true,
      control: { type: "boolean" },
      table: { category: "playground" },
    },
    isCloseDisplayed: {
      type: "boolean",
      description: "Controls if the close button should be rendered.",
      required: true,
      control: { type: "boolean" },
      table: { category: "playground" },
    },
    isBackDisplayed: {
      type: "boolean",
      description: "Controls if the back button should be rendered.",
      required: true,
      control: { type: "boolean" },
      table: { category: "playground" },
    },
    "Header.Children.Text": {
      type: "text",
      description:
        "Any valid text. This parameter is passed to a Text component as children. The Text component is the children of the Header component.",
      required: true,
      control: { type: "text" },
      table: { category: "playground" },
    },
    "Body.Children.Text": {
      type: "text",
      description:
        "Any valid text. This parameter is passed to a Text component as children. The Text component is the children of the Body component.",
      required: true,
      control: { type: "text" },
      table: { category: "playground" },
    },
  },
  args: {
    width: theme.sizes.drawer.popin.max.width,
    height: theme.sizes.drawer.popin.max.height,
    isOpen: true,
    hasHeader: true,
    hasFooter: true,
    isCloseDisplayed: true,
    isBackDisplayed: true,
    "Body.Children.Text": `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus dignissim fermentum lectus, eu aliquet arcu tincidunt a. Etiam dapibus dolor at felis pretium, a posuere turpis dapibus. Mauris id felis et quam accumsan congue. Curabitur auctor nunc nec augue suscipit sagittis. Nunc eu eros varius, bibendum ligula id, molestie quam. Nam ac sem et mi pellentesque rhoncus sed eu nisi. Maecenas auctor elit at sollicitudin imperdiet. Sed mollis eros at nunc malesuada posuere. Suspendisse luctus commodo porttitor. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus dignissim fermentum lectus, eu aliquet arcu tincidunt a. Etiam dapibus dolor at felis pretium, a posuere turpis dapibus. Mauris id felis et quam accumsan congue. Curabitur auctor nunc nec augue suscipit sagittis. Nunc eu eros varius, bibendum ligula id, molestie quam. Nam ac sem et mi pellentesque rhoncus sed eu nisi. Maecenas auctor elit at sollicitudin imperdiet. Sed mollis eros at nunc malesuada posuere. Suspendisse luctus commodo porttitor. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus dignissim fermentum lectus, eu aliquet arcu tincidunt a. Etiam dapibus dolor at felis pretium, a posuere turpis dapibus. Mauris id felis et quam accumsan congue. Curabitur auctor nunc nec augue suscipit sagittis. Nunc eu eros varius, bibendum ligula id, molestie quam. Nam ac sem et mi pellentesque rhoncus sed eu nisi. Maecenas auctor elit at sollicitudin imperdiet. Sed mollis eros at nunc malesuada posuere. Suspendisse luctus commodo porttitor. Mauris id felis et quam accumsan congue. Curabitur auctor nunc nec augue suscipit sagittis. Nunc eu eros varius, bibendum ligula id, molestie quam. Nam ac sem et mi pellentesque rhoncus sed eu nisi. Maecenas auctor elit at sollicitudin imperdiet. Sed mollis eros at nunc malesuada posuere. Suspendisse luctus commodo porttitor. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus dignissim fermentum lectus, eu aliquet arcu tincidunt a. Etiam dapibus dolor at felis pretium, a posuere turpis dapibus. Mauris id felis et quam accumsan congue. Curabitur auctor nunc nec augue suscipit sagittis. Nunc eu eros varius, bibendum ligula id, molestie quam. Nam ac sem et mi pellentesque rhoncus sed eu nisi. Maecenas auctor elit at sollicitudin imperdiet. Sed mollis eros at nunc malesuada posuere. Suspendisse luctus commodo porttitor. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus dignissim fermentum lectus, eu aliquet arcu tincidunt a. Etiam dapibus dolor at felis pretium, a posuere turpis dapibus. Mauris id felis et quam accumsan congue. Curabitur auctor nunc nec augue suscipit sagittis. Nunc eu eros varius, bibendum ligula id, molestie quam. Nam ac sem et mi pellentesque rhoncus sed eu nisi. Maecenas auctor elit at sollicitudin imperdiet. Sed mollis eros at nunc malesuada posuere. Suspendisse luctus commodo porttitor. Mauris id felis et quam accumsan congue. Curabitur auctor nunc nec augue suscipit sagittis. Nunc eu eros varius, bibendum ligula id, molestie quam. Nam ac sem et mi pellentesque rhoncus sed eu nisi. Maecenas auctor elit at sollicitudin imperdiet. Sed mollis eros at nunc malesuada posuere. Suspendisse luctus commodo porttitor. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus dignissim fermentum lectus, eu aliquet arcu tincidunt a. Etiam dapibus dolor at felis pretium, a posuere turpis dapibus. Mauris id felis et quam accumsan congue. Curabitur auctor nunc nec augue suscipit sagittis. Nunc eu eros varius, bibendum ligula id, molestie quam. Nam ac sem et mi pellentesque rhoncus sed eu nisi. Maecenas auctor elit at sollicitudin imperdiet. Sed mollis eros at nunc malesuada posuere. Suspendisse luctus commodo porttitor. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus dignissim fermentum lectus, eu aliquet arcu tincidunt a. Etiam dapibus dolor at felis pretium, a posuere turpis dapibus. Mauris id felis et quam accumsan congue. Curabitur auctor nunc nec augue suscipit sagittis. Nunc eu eros varius, bibendum ligula id, molestie quam. Nam ac sem et mi pellentesque rhoncus sed eu nisi. Maecenas auctor elit at sollicitudin imperdiet. Sed mollis eros at nunc malesuada posuere. Suspendisse luctus commodo porttitor.`,
    "Header.Children.Text": "This is a fake title",
  },
};

type playgroundProps = {
  "Header.Children.Text": string;
  "Body.Children.Text": string;
  hasHeader: boolean;
  hasFooter: boolean;
  isCloseDisplayed: boolean;
  isBackDisplayed: boolean;
};

const Template = (args: PopinProps & playgroundProps) => {
  const [, updateArgs] = useArgs();

  /* Allow interactive controls from the story. Thanks to this, triggering onClose
   ** function from the component itself (by clicking on the cross icon e.g.)
   ** will update the value of the isOpen props.
   */
  const onClose = () => updateArgs({ isOpen: false });

  return (
    <>
      <Button variant="shade" onClick={() => updateArgs({ isOpen: true })}>
        Open the modal
      </Button>
      <Popin {...args}>
        {args.hasHeader ? (
          <Popin.Header
            onBack={args.isBackDisplayed ? action("previous") : undefined}
            onClose={args.isCloseDisplayed ? onClose : undefined}
          >
            <Text variant="h5">{args["Header.Children.Text"]}</Text>
          </Popin.Header>
        ) : null}
        <Popin.Body>
          <Text variant="paragraph">{args["Body.Children.Text"]}</Text>
        </Popin.Body>
        {args.hasFooter ? (
          <Popin.Footer flexDirection="row-reverse">
            <Button variant="main" onClick={action("next")}>
              Next
            </Button>
          </Popin.Footer>
        ) : null}
      </Popin>
    </>
  );
};

export const Default = Template.bind({});
