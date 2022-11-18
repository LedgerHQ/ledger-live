export const descriptionCardB = `
### A simple content card.

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
