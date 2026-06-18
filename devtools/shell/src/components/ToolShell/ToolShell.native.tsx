import { Suspense } from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import type { Tool } from "@devtools/registry";
import { useToolProps } from "../../context";
import { Loading } from "../Loading/Loading.native";

interface ToolShellProps {
  readonly tool: Tool;
}

export function ToolShell({ tool }: ToolShellProps) {
  const toolProps = useToolProps(tool.id) ?? {};
  const Component = tool.component;

  return (
    <Box lx={{ flex: 1 }}>
      <Suspense fallback={<Loading />}>
        <Component {...toolProps} />
      </Suspense>
    </Box>
  );
}

export default ToolShell;
