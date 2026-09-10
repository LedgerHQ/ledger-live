import type {
  Analytics,
  EnabledFn,
  ExtraPropsFn,
  MandatoryExtraPropsFn,
  Props,
  PropsFilter,
} from "./types";

let _analytics: Analytics | undefined;
let _enabledFn: EnabledFn | undefined;
let _extraPropsFn: ExtraPropsFn | undefined;
let _mandatoryExtraPropsFn: MandatoryExtraPropsFn | undefined;
let _propsFilter: PropsFilter | undefined;

export function setAnalytics(analytics: Analytics): void {
  _analytics = analytics;
}

export function getAnalytics(): Analytics | undefined {
  return _analytics;
}

export function setEnabledFn(enabledFn?: EnabledFn): void {
  _enabledFn = enabledFn;
}

export function isEnabled(): boolean {
  return _enabledFn?.() ?? false;
}

export function setExtraPropsFn(extraPropsFn?: ExtraPropsFn): void {
  _extraPropsFn = extraPropsFn;
}

export function setMandatoryExtraPropsFn(mandatoryExtraPropsFn?: MandatoryExtraPropsFn): void {
  _mandatoryExtraPropsFn = mandatoryExtraPropsFn;
}

export function resolveExtraProps(mandatory: boolean): Props | Promise<Props> | undefined {
  return mandatory ? _mandatoryExtraPropsFn?.() : _extraPropsFn?.();
}

export function setPropsFilter(propsFilter?: PropsFilter): void {
  _propsFilter = propsFilter;
}

export function applyPropsFilter(props: Props): Props {
  return _propsFilter ? _propsFilter(props) : props;
}
