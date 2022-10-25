import React from "react";

import { connect } from "react-redux";
import { Text } from "@ledgerhq/native-ui";
import { setCountervalue } from "../../../actions/settings";
import {
  counterValueCurrencySelector,
  supportedCountervalues,
} from "../../../reducers/settings";
import { State } from "../../../reducers";
import makeGenericSelectScreen from "../../makeGenericSelectScreen";

const items = supportedCountervalues
  .map(cur => ({ value: cur.ticker, label: cur.name }))
  .sort((a, b) => a.label.localeCompare(b.label));

const mapStateToProps = (state: State) => ({
  selectedKey: counterValueCurrencySelector(state).ticker,
  items,
});

const mapDispatchToProps = {
  onValueChange: ({ value }: any) => setCountervalue(value),
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

// $FlowFixMe
export default connect(mapStateToProps, mapDispatchToProps)(Screen);
