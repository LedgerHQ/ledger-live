import React from "react";
import { Flex, Button } from "@ledgerhq/native-ui";
import { useTheme } from "styled-components/native";
import SafeAreaView from "~/components/SafeAreaView";
import TextInput from "~/components/TextInput";
import { useNavigation } from "@react-navigation/native";
import { ScreenName } from "~/const";

function CreateConversation() {
  const { colors } = useTheme();
  const [inputValue, setInputValue] = React.useState("");
  const navigation = useNavigation();
  const handleCreate = () => {
    // Handle the creation of a new conversation
    console.log("Creating conversation with URL:", inputValue);
    navigation.navigate(ScreenName.CreateConversationProcess, { name: inputValue });
  };
  return (
    <SafeAreaView edges={["top"]} isFlex style={{ marginHorizontal: 8 }}>
      <Flex backgroundColor={colors.background.main}>
        <TextInput
          value={inputValue}
          onChangeText={setInputValue}
          numberOfLines={1}
          placeholder="Conversation name"
        />
        <Button type="main" mt={4} onPress={handleCreate}>
          Create Conversation
        </Button>
      </Flex>
    </SafeAreaView>
  );
}

export default CreateConversation;
