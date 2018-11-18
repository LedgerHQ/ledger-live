/* @flow */
import React, { PureComponent } from "react";
import { View, StyleSheet, TextInput } from "react-native";
import Icon from "react-native-vector-icons/dist/FontAwesome";
import Touchable from "./Touchable";
import colors from "../colors";

type Props = {
  secureTextEntry: boolean,
  onChange: string => void,
  onSubmit: string => void,
  toggleSecureTextEntry: () => void,
  placeholder: string,
};

class PasswordInput extends PureComponent<Props> {
  render() {
    const {
      secureTextEntry,
      onChange,
      onSubmit,
      toggleSecureTextEntry,
      placeholder,
    } = this.props;
    return (
      <View style={styles.container}>
        <TextInput
          autoFocus
          style={[styles.input]}
          placeholder={placeholder}
          placeholderTextColor={colors.lightFog}
          returnKeyType="done"
          onChangeText={onChange}
          onSubmitEditing={onSubmit}
          secureTextEntry={secureTextEntry}
        />
        {secureTextEntry ? (
          <Touchable style={styles.iconInput} onPress={toggleSecureTextEntry}>
            <Icon name="eye-slash" size={16} color={colors.grey} />
          </Touchable>
        ) : (
          <Touchable style={styles.iconInput} onPress={toggleSecureTextEntry}>
            <Icon name="eye" size={16} color={colors.grey} />
          </Touchable>
        )}
      </View>
    );
  }
}

export default PasswordInput;
const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  input: {
    fontSize: 20,
    marginHorizontal: 16,
    paddingVertical: 24,
  },
  iconInput: {
    justifyContent: "center",
    marginRight: 16,
  },
});
