export const descriptionCardA = `
### A simple content card A.

This simple card implementation component allows to display specific content for users

## Usage


### Import  
\`\`\`ts

import { CardA } from "@ledgerhq/native-ui"
\`\`\`


### Props 
\`\`\`ts
type Props = {
  variant?: "purple" | "red";
  backgroundImage?: string;
  tag?: string;
  description?: string;
  onPress?: () => void;
  onDismiss?: () => void;
};

Use the tag <bold>YourText</bold> in description if you want to highlight some text in the card

\`\`\`

### Integration 

\`\`\`ts

const MyCardA = (): JSX.Element => {

  return (
    <CardA
      variant="purple"
      tag="Promo"
      description="Lorem <bold>ipsum</bold> dolor sit amet, consectetur adipiscing elit."
    />
  );
};
\`\`\`
`;

export const descriptionCardB = `
### A simple content card B.

This simple card implementation component allows to display specific content for users

## Usage


### Import  
\`\`\`ts

import { CardB } from "@ledgerhq/native-ui"
\`\`\`


### Props 
\`\`\`ts
type CardProps = TouchableOpacityProps & {
  tag?: string;
  title?: string;
  cta?: string;
  imageUrl?: string;
  onPressDismiss?: () => void;
};

Use the tag <bold>YourText</bold> in title if you want to highlight some text in the card

\`\`\`

### Integration 

\`\`\`ts

const MyCard = (): JSX.Element => {
const onPress = ()=> console.log("PRESS")
const onPressDismiss = ()=> console.log("DISMISS")
  return (
    <CardB 
      tag="Promo" 
      title="Announcement for promotion" 
      cta="Click"
      onPress={onPress}
      onPressDismiss={onPressDismiss}
      imageUrl="https://www.cointribune.com/app/uploads/2020/12/LEDGER-Nano-X.jpg?nowebp" 
    />
  );
};
\`\`\`
`;
