// Device and Platform Types
export interface Platform {
  version: string;
  name: string;
}

export interface Resolution {
  width: number;
  height: number;
  pixel_ratio: number;
}

export interface TestDevice {
  platform: Platform;
  name: string;
  resolution: Resolution;
  id: string;
  type: string;
}

// Bucket Keys Types
export interface TestBucketKeys {
  screenshot: string;
  source: string;
}

export interface TestBucketKeys {
  artifacts: string;
  device_logs: string;
}

// Sub Step Types
export interface SubStepParentTest {
  id: string;
}

export interface SubStepParentStep {
  id: string;
}

export interface SubStep {
  parent_test: SubStepParentTest;
  level: number;
  parent_step: SubStepParentStep;
}

// Sub Test Type
export interface SubTest {
  id: string;
}

// Element Updates Types
export interface MultiLocator {
  ab: string;
  co: string;
  ro: string;
}

export interface ElementUpdates {
  multi_locator?: MultiLocator;
}

// Bounds Type
export interface Bounds {
  width: number;
  y: number;
  height: number;
  x: number;
}

// Assertion Result Type
export interface AssertionResult {
  expected: string;
  has_secure_variables: boolean;
}

// Step Types
export interface BaseStep {
  status: "passed" | "failed";
  description: string;
  id: string;
  allow_failure: boolean;
  duration: number;
  started_at: number;
  is_critical: boolean;
}

export interface PlaySubTestStep extends BaseStep {
  type: "playSubTest";
  sub_test: SubTest;
}

export interface TapStep extends BaseStep {
  type: "tap";
  bucket_keys: TestBucketKeys;
  bounds: Bounds;
  element_updates: ElementUpdates;
  locate_element_duration: number;
  element_description: string;
  sub_step: SubStep;
}

export interface RestartApplicationStep extends BaseStep {
  type: "restartApplication";
  bucket_keys: TestBucketKeys;
  sub_step: SubStep;
}

export interface AssertScreenContainsStep extends BaseStep {
  type: "assertScreenContains";
  bucket_keys: TestBucketKeys;
  assertion_result: AssertionResult;
  bounds: Bounds;
  sub_step: SubStep;
}

// Union type for all step types
export type TestResultStep =
  | PlaySubTestStep
  | TapStep
  | RestartApplicationStep
  | AssertScreenContainsStep;

// Result Type
export interface TestResult {
  steps: TestResultStep[];
  status: "passed" | "failed";
  bucket_keys: TestBucketKeys;
  is_fast_retry: boolean;
  id: string;
  initial_id: string;
  is_last_retry: boolean;
  duration: number;
  started_at: number;
  finished_at: number;
  triggered_at: number;
  run_type: string;
}

export interface TestInfoConfigVariables {
  // Empty array in the provided data, but could contain variables
}

export interface TestInfoConfigRequest {
  // Empty object in the provided data, but could contain request configuration
}

export interface TestInfoConfig {
  configVariables: TestInfoConfigVariables[];
  variables: TestInfoConfigVariables[];
  config_variables: TestInfoConfigVariables[];
  request: TestInfoConfigRequest;
}

// Mobile Application Type
export interface TestInfoOptionsMobileApplication {
  applicationId: string;
  referenceId: string;
  referenceType: string;
}

// Retry Configuration Type
export interface TestInfoOptionsRetry {
  count: number;
  interval: number;
}

// Monitor Options Type
export interface TestInfoOptionsMonitor {
  notification_preset_name: string;
}

// Test Options Type
export interface TestInfoOptions {
  device_ids: string[];
  mobileApplication: TestInfoOptionsMobileApplication;
  tick_every: number;
  min_failure_duration: number;
  retry: TestInfoOptionsRetry;
  monitor_options: TestInfoOptionsMonitor;
  disableAutoAcceptAlert: boolean;
  allowApplicationCrash: boolean;
  enableNetworkInstrumentation: boolean;
}

// Creator Type
export interface TestInfoCreator {
  name: string;
  handle: string;
  email: string;
}

// Test Type
export interface TestInfo {
  public_id: string;
  name: string;
  status: "paused" | "live" | "stopped";
  type: "mobile" | "browser" | "api";
  tags: string[];
  created_at: string;
  modified_at: string;
  config: TestInfoConfig;
  message: string;
  options: TestInfoOptions;
  locations: string[];
  monitor_id: number;
  creator: TestInfoCreator;
}

// Main Test Result Type
export interface Test {
  device: TestDevice;
  duration: number;
  executionRule: "blocking" | "non_blocking";
  isNonFinal: boolean;
  location: string;
  passed: boolean;
  result: TestResult;
  resultId: string;
  retries: number;
  maxRetries: number;
  test: TestInfo;
  timedOut: boolean;
  timestamp: number;
}

// Root type - array of test results
export type TestOutput = Test[];
