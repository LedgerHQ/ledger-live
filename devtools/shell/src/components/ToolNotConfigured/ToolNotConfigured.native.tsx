import { Text } from "@ledgerhq/lumen-ui-rnative";

const ToolNotConfigured = () => (
  <Text typography="body2" lx={{ color: "muted" }}>
    Props were not provided for this tool.
  </Text>
);

export default ToolNotConfigured;
