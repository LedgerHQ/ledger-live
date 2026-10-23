const React = require("react");
const { View } = require("react-native");

function DraggableFlatList({
  data,
  renderItem,
  keyExtractor,
  ListHeaderComponent,
  ListFooterComponent,
  testID,
}) {
  return React.createElement(
    View,
    { testID },
    ListHeaderComponent ?? null,
    ...data.map((item, index) =>
      React.createElement(
        View,
        { key: keyExtractor(item, index) },
        renderItem({ item, index, drag: () => {}, isActive: false, getIndex: () => index }),
      ),
    ),
    ListFooterComponent ?? null,
  );
}

function PassthroughDecorator(props) {
  return props.children ?? null;
}

module.exports = {
  __esModule: true,
  default: DraggableFlatList,
  ScaleDecorator: PassthroughDecorator,
  ShadowDecorator: PassthroughDecorator,
  OpacityDecorator: PassthroughDecorator,
};
