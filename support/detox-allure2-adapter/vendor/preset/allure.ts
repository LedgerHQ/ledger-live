// eslint-disable-next-line import/no-internal-modules
import { config, session } from 'detox/internals';
import type {
  KeyedParameterCustomizer,
  ReporterOptions,
  TestCaseCustomizer,
  TestCaseExtractorContext,
  StatusDetails,
} from '@support/jest-allure2-reporter';

const historyId: TestCaseCustomizer['historyId'] = ({ value }): string => {
  const { type } = config.device;
  const platform = type.split('.')[0];
  return `${platform}:${value}`;
};

const device: KeyedParameterCustomizer<unknown> = (): string | undefined => {
  const { type, device } = config.device as any;

  switch (type) {
    case 'ios.simulator': {
      return [device.type, device.os].filter(Boolean).join(', ') || 'iOS Simulator';
    }
    case 'android.emulator': {
      return device.avdName || 'Android Emulator';
    }
    case 'android.genycloud': {
      return device.recipeName || 'Genymotion SaaS';
    }
    default: {
      return;
    }
  }
};

const statusDetails: TestCaseCustomizer['statusDetails'] = ({ value }) => {
  const maybeValue = value as StatusDetails | undefined;
  const message = maybeValue?.message;
  const trace = maybeValue?.trace;

  if (typeof message === 'string' && (!trace || typeof trace === 'string')) {
    const lines = message.split('\n');
    if (lines.length > 1) {
      const [first, ...rest] = message.split('\n');
      if (trace) {
        rest.push(trace);
      }

      return {
        message: first,
        trace: rest.join('\n').trimStart(),
      };
    }
  }

  return value;
};

const status: TestCaseCustomizer<TestCaseExtractorContext>['status'] = ({
  testCase: { failureMessages },
  value,
}) => {
  if (value !== 'broken') {
    return value;
  }

  return failureMessages.every((x) => x.includes('Test Failed:')) ? 'failed' : 'broken';
};

const options: ReporterOptions = {
  overwrite: session.testSessionIndex === 0,
  resultsDir: 'artifacts',
  attachments: {
    fileHandler: 'copy',
  },
  testCase: {
    historyId,
    status,
    statusDetails,
    parameters: {
      device,
    },
  },
  testFile: {
    historyId,
    statusDetails,
    parameters: {
      device,
    },
  },
};

export default options;
