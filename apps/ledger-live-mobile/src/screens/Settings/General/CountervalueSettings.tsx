import React from "react";

import { connect } from "react-redux";
import { Text } from "@ledgerhq/native-ui";
import { setCountervalue } from "~/actions/settings";
import { counterValueCurrencySelector, getSupportedCounterValues } from "~/reducers/settings";
import { State } from "~/reducers/types";
import makeGenericSelectScreen from "../../makeGenericSelectScreen";

const mapStateToProps = (state: State) => ({
  selectedKey: counterValueCurrencySelector(state).ticker,
  items: getSupportedCounterValues(state),
});

const mapDispatchToProps = {
  onValueChange: ({ value }: { value: string }) => setCountervalue(value),
};

const Screen = makeGenericSelectScreen({
  id: "CounterValueSettingsSelect",
  itemEventProperties: item => ({ countervalue: item.value }),
  keyExtractor: item => item.value,
  formatItem: item => (
    <>
      {item.label}
      {"  "}
      <Text variant={"body"} fontWeight={"medium"} color={"neutral.c70"} ml={3}>
        {item.value}
      </Text>
    </>
  ),
});

export default connect(mapStateToProps, mapDispatchToProps)(Screen);
