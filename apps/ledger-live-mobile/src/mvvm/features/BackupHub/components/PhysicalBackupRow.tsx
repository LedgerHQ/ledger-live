import React from "react";
import { Image, type ImageSourcePropType } from "react-native";
import {
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
} from "@ledgerhq/lumen-ui-rnative";
import { ExternalLink } from "@ledgerhq/lumen-ui-rnative/symbols";

export type PhysicalBackupRowProps = {
  image: ImageSourcePropType;
  title: string;
  description: string;
  isWarning?: boolean;
  onPress: () => void;
  testID?: string;
};

export function PhysicalBackupRow({
  image,
  title,
  description,
  isWarning = false,
  onPress,
  testID,
}: Readonly<PhysicalBackupRowProps>) {
  return (
    <ListItem onPress={onPress} testID={testID}>
      <ListItemLeading>
        <Image
          source={image}
          style={{ width: 48, height: 48, borderRadius: 8 }}
          resizeMode="contain"
        />
        <ListItemContent>
          <ListItemTitle>{title}</ListItemTitle>
          <ListItemDescription numberOfLines={2} lx={isWarning ? { color: "warning" } : undefined}>
            {description}
          </ListItemDescription>
        </ListItemContent>
      </ListItemLeading>
      <ListItemTrailing>
        <ExternalLink size={24} color="muted" />
      </ListItemTrailing>
    </ListItem>
  );
}
