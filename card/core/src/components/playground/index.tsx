import { PlaygroundView } from "./PlaygroundView";
import { usePlaygroundViewModel } from "./usePlaygroundViewModel";

export function Playground() {
  const vm = usePlaygroundViewModel();
  return <PlaygroundView {...vm} />;
}

export default Playground;
