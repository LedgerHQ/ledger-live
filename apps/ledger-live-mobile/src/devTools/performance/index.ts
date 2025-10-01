import performance from "react-native-performance";
import { ValueOrOptions } from "react-native-performance/lib/typescript/performance";

const mark = (name: string) => performance.mark(name);
const measureBetween = (name: string, start: string, end: string) =>
  performance.measure(name, start, end);
const metric = (name: string, valueOrOptions: ValueOrOptions) =>
  performance.metric(name, valueOrOptions);

export { mark, measureBetween, metric, performance };
