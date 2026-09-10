import type {
  AnalyticsTransport,
  EnabledFunction,
  ExtraPropertiesFunction,
  MandatoryExtraPropertiesFunction,
  Props,
  PropertyFilter,
} from "./types";

let transport: AnalyticsTransport | undefined;
let enabledFunction: EnabledFunction | undefined;
let extraPropertiesFunction: ExtraPropertiesFunction | undefined;
let mandatoryExtraPropertiesFunction: MandatoryExtraPropertiesFunction | undefined;
let propertyFilter: PropertyFilter | undefined;

export function setAnalytics(next: AnalyticsTransport): void {
  transport = next;
}

export function getAnalytics(): AnalyticsTransport | undefined {
  return transport;
}

export function setEnabledFunction(next?: EnabledFunction): void {
  enabledFunction = next;
}

export function getEnabledFunction(): EnabledFunction | undefined {
  return enabledFunction;
}

export function setExtraPropertiesFunction(next?: ExtraPropertiesFunction): void {
  extraPropertiesFunction = next;
}

export function setMandatoryExtraPropertiesFunction(next?: MandatoryExtraPropertiesFunction): void {
  mandatoryExtraPropertiesFunction = next;
}

export function resolveExtraProperties(mandatory: boolean): Props | Promise<Props> | undefined {
  return mandatory ? mandatoryExtraPropertiesFunction?.() : extraPropertiesFunction?.();
}

export function setPropertyFilter(next?: PropertyFilter): void {
  propertyFilter = next;
}

export function applyPropertyFilter(properties: Props): Props {
  return propertyFilter ? propertyFilter(properties) : properties;
}
