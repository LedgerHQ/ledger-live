const React = require("react");

function SectionList({
  sections,
  ListHeaderComponent,
  keyExtractor,
  renderItem,
  renderSectionHeader,
  ...props
}) {
  const header =
    typeof ListHeaderComponent === "function"
      ? React.createElement(ListHeaderComponent)
      : ListHeaderComponent;

  return React.createElement(
    "SectionList",
    props,
    header,
    sections.map(section =>
      React.createElement(
        React.Fragment,
        { key: section.title },
        renderSectionHeader?.({ section }),
        section.data.map((item, index) =>
          React.createElement(
            React.Fragment,
            { key: keyExtractor?.(item, index) ?? index },
            renderItem({ item, index, section, separators: {} }),
          ),
        ),
      ),
    ),
  );
}

// Minimal react-native stub so native tests run in a plain node env without booting the RN
// runtime (whose index.js is Flow-typed ESM). Mapped via moduleNameMapper so it intercepts
// every `react-native` import, including from @testing-library/react-native.
module.exports = {
  Platform: { OS: "ios", select: obj => obj.ios },
  StyleSheet: {
    create: styles => styles,
    flatten: style => (Array.isArray(style) ? Object.assign({}, ...style) : style || {}),
  },
  SectionList,
  View: "View",
  Text: "Text",
};
