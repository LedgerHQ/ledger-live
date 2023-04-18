export const descriptionFullBackgroundCard = `
### A simple content card with a full background.

This simple card implementation component allows to display specific content for users

## Usage


### Import
\`\`\`ts

import { FullBackgroundCard } from "@ledgerhq/native-ui"
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

const MyCard = (): JSX.Element => {
  return (
    <FullBackgroundCard
      variant="purple"
      tag="Promo"
      description="Lorem <bold>ipsum</bold> dolor sit amet, consectetur adipiscing elit."
    />
  );
};
\`\`\`
`;

export const descriptionSideImageCard = `
### A simple content card with a side image.

This simple card implementation component allows to display specific content for users

## Usage


### Import
\`\`\`ts

import { SideImageCard } from "@ledgerhq/native-ui"
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
    <SideImageCard
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

export const descriptionInformativeCard = `
### A simple content card for information.

This simple card implementation component allows to display specific content for users

## Usage


### Import
\`\`\`ts

import { InformativeCard } from "@ledgerhq/native-ui"
\`\`\`


### Props
\`\`\`ts
type CardProps = TouchableOpacityProps & {
  tag?: string;
  title?: string;
  imageUrl?: string;
  onClickCard?: () => void;
};

\`\`\`

### Integration

\`\`\`ts

const MyCard = (): JSX.Element => {
  return (
    <InformativeCard
      tag="Article"
      title="Learn how to stake?"
      imageUrl="https://www.cointribune.com/app/uploads/2020/12/LEDGER-Nano-X.jpg?nowebp"
    />
  );
};
\`\`\`
`;

export const descriptionNotificationCard = `
### A simple content card for Notifications.

This simple card implementation component allows to display specific content for users

## Usage


### Import
\`\`\`ts

import { NotificationCard } from "@ledgerhq/native-ui"
\`\`\`


### Props
\`\`\`ts
type CardProps = {
  tag?: string;
  description?: string;
  cta?: string;
  time?: string;
  title?: string; // Timestamp
  onPressDismiss?: () => void;
  onPress?: () => void;
  viewed: boolean;
};
\`\`\`

### Integration

\`\`\`ts

const MyCard = (): JSX.Element => {
const onPress = ()=> console.log("PRESS")
const onPressDismiss = ()=> console.log("DISMISS")
  return (
    <NotificationCard
      tag="Promo"
      title="Announcement"
      description="Announcement for promotion"
      time={1669736575}
      viewed={false}
    />
  );
};
\`\`\`
`;
