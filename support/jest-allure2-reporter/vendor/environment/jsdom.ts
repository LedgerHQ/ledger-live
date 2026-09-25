import JestEnvironmentJsdom from 'jest-metadata/environment-jsdom';

import listener from './listener';

export const TestEnvironment = JestEnvironmentJsdom.derive(listener, 'WithAllure');

export default TestEnvironment;
