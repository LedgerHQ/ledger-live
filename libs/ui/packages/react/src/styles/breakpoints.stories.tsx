import React from "react";

import Flex from "../components/layout/Flex";
import Text from "../components/asorted/Text";

const description = `
## <Heading hidden>Overview</Heading>

Every utility class can be applied conditionally at different breakpoints, which makes it a piece of cake to build complex responsive interfaces without ever leaving your HTML.

There are five breakpoints by default, inspired by common device resolutions:

| Breakpoint prefix | Minimum width | CSS |
| --- | --- | --- |
| 'sm' | 640px | '@media (min-width: 640px) { ... }' |
| 'md' | 768px | '@media (min-width: 768px) { ... }' |
| 'lg' | 1024px | '@media (min-width: 1024px) { ... }' |
| 'xl' | 1280px | '@media (min-width: 1280px) { ... }' |
| 'xxl' | 1536px | '@media (min-width: 1536px) { ... }' |

To add a utility but only have it take effect at a certain breakpoint, all you need to do is to specify an object in the class you want to be responsive


\`\`\`html
<!-- Width of 16 by default, 32 on medium screens, and 48 on large screens -->
<Flex 
  height={400} 
  width="100%" 
  backgroundColor={{_: 'yellow', sm: 'purple', md: 'green', lg:'cyan', xl: 'orange', xxl: 'red'}}>
</Flex>
\`\`\`

## Mobile First

By default, Ledger ui uses a mobile first breakpoint system, similar to what you might be used to in other frameworks like Bootstrap or tailwind.

What this means is that unprefixed utilities (like \`uppercase\`) take effect on all screen sizes, while prefixed utilities (like \`md:uppercase\`) only take effect at the specified breakpoint *and above*.

### Targeting mobile screens

Where this approach surprises people most often is that to style something for mobile, you need to use the unprefixed version of a utility, not the \`sm:\` prefixed version. Don't think of \`sm:\` as meaning "on small screens", think of it as "at the small *breakpoint*".

<TipBad>Don't use <code className="text-sm font-bold text-slate-800">sm:</code> to target mobile devices</TipBad>

\`\`\`html
<!-- This will only center text on screens 640px and wider, not on small screens -->
<Text textAlign={{sm: "center"}}></Text>
\`\`\`

<TipGood>Use unprefixed utilities to target mobile, and override them at larger breakpoints</TipGood>

\`\`\`html
<!-- This will center text on mobile, and left align it on screens 640px and wider -->
<Text textAlign={{_: "center", sm: "left"}}></Text>
\`\`\`

`;
export default {
  title: "Particles",
  parameters: {
    docs: {
      description: {
        component: description,
      },
    },
  },
};

export const Breakpoints = (): JSX.Element => {
  return (
    <Flex flexDirection="column" rowGap="24px">
      <Flex
        flexDirection="column"
        rowGap="4px"
        justifyContent="center"
        alignItems="center"
        height={400}
        width="100%"
        backgroundColor={{
          _: "yellow",
          sm: "purple",
          md: "green",
          lg: "cyan",
          xl: "orange",
          xxl: "red",
        }}
      >
        <Text display={{ _: "none", sm: "block", md: "none" }}>SM breakpoint</Text>
        <Text display={{ _: "none", md: "block", lg: "none" }}>MD breakpoint</Text>
        <Text display={{ _: "none", lg: "block", xl: "none" }}>LG breakpoint</Text>
        <Text display={{ _: "none", xl: "block", xxl: "none" }}>XL breakpoint</Text>
        <Text display={{ _: "none", xxl: "block" }}>XXL breakpoint</Text>
      </Flex>
    </Flex>
  );
};
