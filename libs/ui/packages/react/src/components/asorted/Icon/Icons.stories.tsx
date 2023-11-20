import React from "react";
import { Story, Meta } from "@storybook/react";
import * as Icons from "@ledgerhq/icons-ui/react";
import styled from "styled-components";
import { Flex, Text } from "../../..";
import { useTheme } from "styled-components";

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

export default {
  title: "asorted/Icons",
  component: null, // Since we're rendering multiple icons, we don't have a single component to import
} as Meta;

interface IconProps {
  size?: keyof AvailableSizes;
  color?: string;
  style?: React.CSSProperties;
}

const IconContainer = styled(Flex).attrs<{ active?: boolean }>({
  flexDirection: "column",
  justifyContent: "flex-end",
  alignItems: "center",
  p: 4,
  fill: "black",
})<{ active?: boolean }>`
  ${p => (p.active ? `background-color: ${p.theme.colors.neutral.c20};` : ``)}
  border-radius: 4px;
  height: 100px;
`;

const IconGridTemplate: React.FC<IconProps> = ({ size, color, style }) => {
  const iconNames = Object.keys(Icons) as (keyof typeof Icons)[];

  const theme = useTheme();
  const selectedColor = color || theme.colors.neutral.c100;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
      {iconNames.map(iconName => {
        const IconComponent = Icons[iconName];
        return (
          <IconContainer key={iconName}>
            <IconComponent size={size} color={selectedColor} style={style} />
            <Text pt={6}>{iconName}</Text>
          </IconContainer>
        );
      })}
    </div>
  );
};

export const IconGrid: Story<IconProps> = (args: IconProps) => <IconGridTemplate {...args} />;

IconGrid.args = {
  size: "M",
  color: "",
  style: {},
};

IconGrid.argTypes = {
  size: {
    control: {
      type: "select",
      options: ["XS", "S", "M", "L", "XL"],
    },
  },
  color: { control: "color" },
  style: { control: "object" },
};

IconGrid.parameters = {
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
    \`\`\`
     cd libs/ui/packages/icons && pnpm build
    \`\`\`
   - Alternatively, you can build app dependencies using:
     \`\`\`
      pnpm build:llm:deps
     \`\`\`
   - This step ensures that the updated icons are built into the \`@ledgerHQ/icons-ui\` package.

5. **Verify Changes Locally:**
   - Start your local Storybook to ensure the new icons are rendering correctly:
     \`\`\`
      cd libs/ui/packages/react && pnpm storybook
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
