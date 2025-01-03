import { Button, Flex, Text } from "@ledgerhq/native-ui";
import React from "react";
import TextInput from "~/components/TextInput";
import { CardType } from "./types";

type Props = {
  card: CardType;
};

export default function ContentCard({ card }: Props) {
  return (
    <Flex paddingX={6}>
      {card.fields.map(field => (
        <Flex key={`field-${field.name}`} mb={3}>
          <Text mb={3}>{field.name} :</Text>
          <TextInput value={field.value} onChangeText={field.setValue} placeholder={field.name} />
        </Flex>
      ))}
      <Button mt={4} type="main" onPress={card.onCreate}>
        Create card
      </Button>
    </Flex>
  );
}
