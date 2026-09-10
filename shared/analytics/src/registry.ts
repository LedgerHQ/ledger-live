import type {
  Analytics,
  EnabledFn,
  ExtraPropsFn,
  MandatoryExtraPropsFn,
  Props,
  PropsFilter,
} from "./types";

let analytics: Analytics | undefined;
let enabledFn: EnabledFn | undefined;
let extraPropsFn: ExtraPropsFn | undefined;
let mandatoryExtraPropsFn: MandatoryExtraPropsFn | undefined;
let propsFilter: PropsFilter | undefined;

export function setAnalytics(next: Analytics): void {
  analytics = next;
}

export function getAnalytics(): Analytics | undefined {
  return analytics;
}

export function setEnabledFn(next?: EnabledFn): void {
  enabledFn = next;
}

export function isEnabled(): boolean {
  return enabledFn?.() ?? false;
}

export function setExtraPropsFn(next?: ExtraPropsFn): void {
  extraPropsFn = next;
}

export function setMandatoryExtraPropsFn(next?: MandatoryExtraPropsFn): void {
  mandatoryExtraPropsFn = next;
}

export function resolveExtraProps(mandatory: boolean): Props | Promise<Props> | undefined {
  return mandatory ? mandatoryExtraPropsFn?.() : extraPropsFn?.();
}

export function setPropsFilter(next?: PropsFilter): void {
  propsFilter = next;
}

export function applyPropsFilter(props: Props): Props {
  return propsFilter ? propsFilter(props) : props;
}
