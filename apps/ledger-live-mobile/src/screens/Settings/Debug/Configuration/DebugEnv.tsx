import React, { useMemo, useState, useCallback } from "react";
import Clipboard from "@react-native-clipboard/clipboard";
import Config from "react-native-config";
import { EnvName, setEnvUnsafe, getAllEnvs, getDefinition } from "@ledgerhq/live-env";
import { Flex, Button, Text, Tag, Alert } from "@ledgerhq/native-ui";
import { TouchableOpacity } from "react-native-gesture-handler";
import NavigationScrollView from "~/components/NavigationScrollView";
import TextInput from "~/components/TextInput";
import SectionSeparator from "~/components/SectionSeparator";

export default function DebugEnv() {
  const [value, setValue] = useState<string>("");
  const [resetIndex, setResetIndex] = useState(0);
  const [filter, setFilter] = useState<string>("");
  const [status, setStatus] = useState<string>();
  const [envDefinitions, setEnvDefinitions] = useState<{
    [key: string]: string;
  }>({});

  const envs = useMemo(() => {
    const envs = getAllEnvs();
    const definitions = envDefinitions;

    Object.keys(envs).forEach(key => {
      if (!(key in definitions)) {
        const definition = getDefinition(key);
        if (definition) {
          definitions[key] = definition.desc;
        }
      }
    });
    setEnvDefinitions(definitions);

    return envs;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetIndex]);

  const onSetEnv = useCallback(() => {
    if (!value) return;
    // Attempt to parse this input
    const match = /([\w]+)=(.+)/.exec(value);
    setStatus("");

    if (!match || match.length !== 3) {
      setStatus("Can't parse input");
    } else if (match[2] === "0") {
      setEnvUnsafe(match[1] as EnvName, match[2]);
      delete Config[match[1]];
    } else {
      Config[match[1]] = match[2];
      setEnvUnsafe(match[1] as EnvName, match[2]);
    }
    setResetIndex(resetIndex + 1);
  }, [value, resetIndex]);

  const onPress = useCallback((env: string) => {
    Clipboard.setString(env);
  }, []);

  return (
    <NavigationScrollView>
      <Alert
        type={"info"}
        title={"Changes are only reflected if access to the env is dynamic. Click to copy the key."}
      />
      <Flex p={4}>
        <Text>{status}</Text>
        <TextInput
          value={value}
          maxLength={100}
          onChangeText={setValue}
          placeholder={"DEBUG_THEME=1"}
        />
        <Button type="main" mt={4} mb={4} onPress={onSetEnv}>
          {"Set value for variable"}
        </Button>
        <Flex py={5}>
          <SectionSeparator />
        </Flex>
        <TextInput
          value={filter}
          maxLength={100}
          onChangeText={setFilter}
          placeholder={"Filter the variables"}
        />

        <Flex p={4}>
          {Object.entries(envs)
            .filter(([key]) => key.includes(filter))
            .map(([key, value]) => (
              <TouchableOpacity onPress={() => onPress(key)} key={key}>
                <Flex mb={8}>
                  <Tag
                    uppercase={false}
                    type={value ? "color" : "shade"}
                    mb={2}
                    alignSelf={"flex-start"}
                  >
                    {key}
                  </Tag>
                  <Text color="neutral.c80" mb={2}>
                    {envDefinitions[key]}
                  </Text>
                  <Text color="neutral.c80">{JSON.stringify(value) || "UNSET"}</Text>
                </Flex>
              </TouchableOpacity>
            ))}
        </Flex>
      </Flex>
    </NavigationScrollView>
  );
}
