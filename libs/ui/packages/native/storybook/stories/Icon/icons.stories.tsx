import React from "react";
import { FlatList } from "react-native";
import styled from "styled-components/native";
import * as Icons from "@ledgerhq/icons-ui/native";
import { useTheme } from "styled-components/native";
import { ComponentStory } from "@storybook/react-native";
import Text from "../../../src/components/Text";

interface SizeData {
  size: number;
  stroke: number;
}

interface AvailableSizes {
  XS: SizeData;
  S: SizeData;
  M: SizeData;
  L: SizeData;
  XL: SizeData;
}

interface IconProps {
  size?: keyof AvailableSizes;
  color?: string;
}

const IconContainer = styled.View`
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  padding: 16px;
  border-radius: 4px;
  height: 100px;
  width: 25%;
`;

const IconGrid: React.FC<IconProps> = ({ size = "M", color = "" }) => {
  const iconNames = Object.keys(Icons) as (keyof typeof Icons)[];

  const theme = useTheme();
  const selectedColor = color || theme.colors.neutral.c100;

  const renderItem = ({ item: iconName }: { item: keyof typeof Icons }) => {
    const IconComponent = Icons[iconName];
    return (
      <IconContainer key={iconName}>
        <IconComponent size={size} color={selectedColor} />
        <Text style={{ paddingTop: 6 }}>{iconName}</Text>
      </IconContainer>
    );
  };

  return (
    <FlatList
      data={iconNames}
      renderItem={renderItem}
      keyExtractor={(iconName) => iconName.toString()}
      numColumns={4} // Display 4 icons per row
      /* @ts-expect-error FIXME weird stuff happening here, this prop is legit I promise */
      style={{ width: "100%", height: "100%" }}
      contentContainerStyle={{ alignItems: "stretch", margin: 1 }}
    />
  );
};

// Define the IconGridProps type
export interface IconGridProps {
  size?: keyof AvailableSizes;
  color?: string;
}

export const IconGridStory: ComponentStory<IconGridProps> = (args: IconGridProps) => (
  <IconGrid {...args} />
);

IconGridStory.storyName = "Icons";

IconGridStory.args = {
  size: "M",
  color: "",
};

IconGridStory.argTypes = {
  size: {
    control: {
      type: "select",
      options: ["XS", "S", "M", "L", "XL"],
    },
  },
  color: { control: "color" },
};

IconGridStory.parameters = {
  docs: {
    description: {
      component: `
### Adding New Icons to @ledgerHQ/icons-ui Package

1. **Access Figma Core File:**
   - Navigate to the [Figma Core Library](https://www.figma.com/file/lbUZsVWtBdZpuHSv6lTY9U/%E2%9A%9B%EF%B8%8F-Core-Library?type=design&node-id=12801-12882&mode=design&t=jx0X8jco5kW0wHSP-0).

2. **Export Medium-sized Icons as SVG:**
   - In Figma, open the medium-sized icons.
   - Select all the icons you want to export.
   - Right-click and choose **Export**.
   - Ensure that the export parameters are already set as needed (no modifications required).
   - Export the selected icons as SVG files.

3. **Drop Exported SVGs to icons Package:**
   - Move all the exported SVG files to the \`libs/ui/packages/icons/src/svg\` directory in your project.

4. **Build @ledgerHQ/icons-ui Package:**
   - Run the command to build the \`@ledgerHQ/icons-ui\` package:
    \`\`\`bash
     cd libs/ui/packages/icons && pnpm build
    \`\`\`
   - Alternatively, you can build app dependencies using:
     \`\`\`bash
      pnpm build:llm:deps
     \`\`\`
   - This step ensures that the updated icons are built into the \`@ledgerHQ/icons-ui\` package.

5. **Verify Changes Locally:**
   - Start your local Storybook to ensure the new icons are rendering correctly:
     \`\`\`bash
      cd libs/ui/packages/native && pnpm storybook
     \`\`\`
   - Open your browser and navigate to [http://localhost:6006](http://localhost:6006).
   - Check that the new icons are visible and functional in the Storybook UI.
\n
\n
### Reference
      `,
    },
  },
};

export default IconGridStory;
