import { PnlCalculatorView } from "./PnlCalculatorView";
import { usePnlCalculatorViewModel } from "./usePnlCalculatorViewModel";

export default function PnlCalculator() {
  const viewModel = usePnlCalculatorViewModel();
  return <PnlCalculatorView {...viewModel} />;
}
