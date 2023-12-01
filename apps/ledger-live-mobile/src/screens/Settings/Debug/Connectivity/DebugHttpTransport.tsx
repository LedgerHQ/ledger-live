import React, { useCallback, useState } from "react";
import { Flex } from "@ledgerhq/native-ui";
import { StyleSheet, View } from "react-native";
import { useDispatch } from "react-redux";
import { useNavigation } from "@react-navigation/native";

import { DeviceModelId } from "@ledgerhq/types-devices";
import { StackNavigationProp } from "@react-navigation/stack";
import { addKnownDevice } from "~/actions/ble";
import TextInput from "~/components/TextInput";
import Button from "~/components/Button";
import NavigationScrollView from "~/components/NavigationScrollView";
import { NavigatorName, ScreenName } from "~/const";

const DebugHttpTransport = () => {
  const models = [DeviceModelId.nanoX, DeviceModelId.nanoSP, DeviceModelId.stax];
  const navigation = useNavigation<StackNavigationProp<Record<string, object | undefined>>>();
  const dispatch = useDispatch();
  const [address, setAddress] = useState("");
  const [name, setName] = useState("");
  const [model, setModelId] = useState(DeviceModelId.nanoX);

  const onAdd = useCallback(() => {
    const m = address.trim().match(/^((?:[0-9]{1,3}\.){3}[0-9]{1,3})(:([0-9]+))?/);
    if (!m) return;
    // eslint-disable-next-line prefer-const
    let [, ip, , port] = m;

    if (!port) port = "8435";

    dispatch(
      addKnownDevice({
        id: `httpdebug|ws://${ip}:${port}`,
        name: name || address,
        modelId: model,
      }),
    );

    navigation.navigate(NavigatorName.Manager, {
      screen: ScreenName.Manager,
    });
  }, [address, dispatch, model, name, navigation]);

  return (
    <NavigationScrollView>
      <View
        style={{
          padding: 16,
          flex: 1,
        }}
      >
        <View style={styles.select}>
          {models.map(modelId => (
            <Button
              key={modelId}
              type={modelId === model ? "primary" : "secondary"}
              title={modelId}
              onPress={() => {
                setModelId(modelId as DeviceModelId);
              }}
            />
          ))}
        </View>
        <Flex flex={1}>
          <TextInput
            value={address}
            onChangeText={setAddress}
            autoFocus
            autoCorrect
            selectTextOnFocus
            clearButtonMode="always"
            placeholder="192.168.0.1"
          />
          <TextInput
            value={name}
            onChangeText={setName}
            autoCorrect
            selectTextOnFocus
            clearButtonMode="always"
            placeholder={"Some cool name"}
            returnKeyType="done"
          />
          <View>
            <Button
              disabled={!address}
              type={"primary"}
              event="DebugHttpTransportAdd"
              onPress={onAdd}
              title={"Add"}
            />
          </View>
        </Flex>
      </View>
    </NavigationScrollView>
  );
};

export default DebugHttpTransport;

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  select: {
    flexWrap: "wrap",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
