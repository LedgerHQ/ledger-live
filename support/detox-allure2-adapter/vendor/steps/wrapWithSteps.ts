import path from 'node:path';
// eslint-disable-next-line import/no-internal-modules
import type { AllureRuntime } from '@support/jest-allure2-reporter/api';
import { type StepLogRecorder } from '../logs';
import { type ScreenshotHelper } from '../screenshots';
import type { DetoxTestFailedResult, DetoxInvokeResult, WorkerWrapper } from '../utils';
import { type VideoManager } from '../video';
import { type ViewHierarchyHelper } from '../view-hierarchy';
import { androidDescriptionMaker, iosDescriptionMaker } from './description-maker';
import type { StepDescriptionMaker, StepArgs } from './description-maker';

export interface WrapWithStepsOptions {
  detox: typeof import('detox');
  worker: WorkerWrapper;
  allure: AllureRuntime;
  logs?: StepLogRecorder;
  screenshots?: ScreenshotHelper;
  videoManager?: VideoManager;
  viewHierarchy?: ViewHierarchyHelper;
  userArtifacts: 'ignore' | 'copy' | 'move';
}

interface WrapWithDescriptionMakerOptions extends WrapWithStepsOptions {
  descriptionMaker: StepDescriptionMaker;
  send: (...args: any[]) => Promise<{ type?: string }>;
}

interface WrapWithScreenshotTakingOptions {
  // eslint-disable-next-line @typescript-eslint/ban-types
  method: Function;
  screenshots?: ScreenshotHelper;
  allure: AllureRuntime;
}

export function wrapWithSteps(options: WrapWithStepsOptions) {
  const { allure, detox, worker, userArtifacts, viewHierarchy } = options;
  const { device } = detox;
  const platform = device.getPlatform();

  // Wrap device methods using the helper
  wrapDeviceMethod(options, 'launchApp', 'Launch app');
  wrapDeviceMethod(options, 'relaunchApp', 'Relaunch app');
  wrapDeviceMethod(options, 'openURL', 'Open URL');
  wrapDeviceMethod(options, 'sendToHome', 'Send app to background');
  wrapDeviceMethod(options, 'setOrientation', 'Set orientation');
  wrapDeviceMethod(options, 'matchFace', 'Match face');
  wrapDeviceMethod(options, 'unmatchFace', 'Unmatch face');
  wrapDeviceMethod(options, 'matchFinger', 'Match finger');
  wrapDeviceMethod(options, 'unmatchFinger', 'Unmatch finger');

  device.installApp = allure.createStep('Install app', device.installApp.bind(device));
  device.resetContentAndSettings = allure.createStep(
    'Reset content and settings',
    device.resetContentAndSettings.bind(device),
  );
  device.uninstallApp = allure.createStep(
    'Uninstall app',
    ['bundleId'],
    device.uninstallApp.bind(device),
  );
  device.terminateApp = allure.createStep(
    'Terminate app',
    ['bundleId'],
    device.terminateApp.bind(device),
  );
  device.selectApp = allure.createStep('Select app {{0}}', [null], device.selectApp.bind(device));

  if (typeof device.resetAppState === 'function') {
    device.resetAppState = allure.createStep('Reset app state', device.resetAppState.bind(device));
  }

  if (userArtifacts !== 'ignore') {
    device.takeScreenshot = allure.createFileAttachment(device.takeScreenshot.bind(device), {
      name: '{{firstOr "screenshot"}}.png',
      handler: 'copy',
    });
    device.takeScreenshot = allure.createStep('Take screenshot', [null], device.takeScreenshot);

    device.captureViewHierarchy = allure.createFileAttachment(
      device.captureViewHierarchy.bind(device),
      {
        name: '{{firstOr "capture"}}.viewhierarchy.zip',
        mimeType: 'application/zip',
        handler: 'zip',
      },
    );
    device.captureViewHierarchy = allure.createStep(
      'Capture view hierarchy',
      [null],
      device.captureViewHierarchy,
    );

    if (typeof device.generateViewHierarchyXml === 'function') {
      device.generateViewHierarchyXml = allure.createAttachment(
        device.generateViewHierarchyXml.bind(device),
        {
          name: 'viewhierarchy.xml',
          /**
           * @todo change to application/xhtml+xml when this PR is merged:
           * @link https://github.com/allure-framework/allure2/pull/3133
           */
          mimeType: 'text/html',
          handler: viewHierarchy?.defaultHandler,
        },
      );

      device.generateViewHierarchyXml = allure.createStep(
        'Generate view hierarchy XML',
        ['shouldInjectTestIds'],
        device.generateViewHierarchyXml,
      );
    }
  }

  wrapPilotMethod(options);

  const descriptionMaker = initDescriptionMaker(platform);

  if (descriptionMaker) {
    const ws = worker.asyncWebSocket;

    ws.send = wrapSendMethod({
      ...options,
      descriptionMaker,
      send: ws.send.bind(ws) as (...args: any[]) => Promise<{ type?: string }>,
    });

    const xcuitestRunner = worker.xcuitestRunner;
    if (xcuitestRunner) {
      xcuitestRunner.execute = wrapSendMethod({
        ...options,
        descriptionMaker,
        send: xcuitestRunner.execute.bind(xcuitestRunner),
      });
    }
  }
}

function initDescriptionMaker(platform: string): StepDescriptionMaker | undefined {
  if (platform === 'ios') {
    return iosDescriptionMaker;
  } else if (platform === 'android') {
    return androidDescriptionMaker;
  }
  return undefined;
}

function wrapDeviceMethod(
  { detox, allure, logs, screenshots, videoManager }: WrapWithStepsOptions,
  methodName: string,
  stepDescription: string,
) {
  const device = detox.device as any;
  const originalMethod = device[methodName];
  if (typeof originalMethod !== 'function') return;

  device[methodName] = async (...args: any[]) => {
    await videoManager?.ensureRecording();

    return await allure.step(stepDescription, async () => {
      try {
        logs?.attachBefore(allure);
        const result = await originalMethod.apply(device, args);
        await Promise.all([logs?.attachAfterSuccess(allure), screenshots?.attachSuccess(allure)]);

        return result;
      } catch (error) {
        await Promise.all([logs?.attachAfterFailure(allure), screenshots?.attachFailure(allure)]);

        throw error; // Re-throw the error
      }
    });
  };
}

function wrapPilotMethod({ detox, allure, screenshots }: WrapWithStepsOptions) {
  const pilot = (detox as any).pilot;
  const originalInit = pilot?.init;
  if (typeof originalInit !== 'function') return;

  pilot.init = function () {
    // eslint-disable-next-line prefer-rest-params
    const result = Reflect.apply(originalInit, this, arguments);
    const instance = pilot.pilot;
    if (typeof instance?.performStep === 'function') {
      instance.performStep = allure.createStep(
        '{{0}}',
        [null],
        wrapWithScreenshotTaking({
          method: instance.performStep.bind(instance),
          screenshots,
          allure,
        }),
      );
    }
    if (typeof instance?.autopilot === 'function') {
      instance.autopilot = allure.createStep(
        '{{0}}',
        [null],
        wrapWithScreenshotTaking({
          method: instance.autopilot.bind(instance),
          screenshots,
          allure,
        }),
      );
    }
    return result;
  };
}

function wrapWithScreenshotTaking({
  method,
  screenshots,
  allure,
}: WrapWithScreenshotTakingOptions) {
  if (!screenshots || !allure) {
    return method;
  }

  return async (...args: any[]) => {
    try {
      return await method(...args);
    } catch (error) {
      if (`${error}`.startsWith('Error:')) {
        await screenshots?.attachFailure(allure);
      }

      throw error;
    }
  };
}

function wrapSendMethod({
  descriptionMaker,
  allure,
  logs,
  videoManager,
  screenshots,
  viewHierarchy,
  userArtifacts,
  send,
}: WrapWithDescriptionMakerOptions) {
  const onActionSuccess = async (args: StepArgs, result: DetoxInvokeResult) => {
    await logs?.attachAfterSuccess(allure);

    const screenshotName = args?.screenshot_name;
    if (userArtifacts !== 'ignore' && screenshotName) {
      const screenshotPath = result?.params?.screenshotPath;
      if (screenshotPath) {
        await allure.fileAttachment(screenshotPath, {
          name: path.extname(screenshotName)
            ? screenshotName
            : `${screenshotName}${path.extname(screenshotPath)}`,
          handler: 'copy',
        });
      }

      const screenshotContent = result?.params?.result;
      if (screenshotContent) {
        const name = path.extname(screenshotName) ? screenshotName : `${screenshotName}.png`;
        const buffer = Buffer.from(screenshotContent, 'base64');
        allure.attachment(name, buffer);
      }
    }
  };

  const onActionFailure = async (shouldSetStatus: boolean, result?: DetoxTestFailedResult) => {
    if (shouldSetStatus) {
      allure.status('failed');

      if (result?.params) {
        const { NSLocalizedDescription, details, DetoxFailureInformation } = result.params;
        let message = NSLocalizedDescription || details;
        if (message) {
          let trace = DetoxFailureInformation
            ? `${DetoxFailureInformation.functionName || 'unknown'} at ${DetoxFailureInformation.file || 'unknown'}:${DetoxFailureInformation.lineNumber || 'unknown'}`
            : undefined;

          if (message.includes('\n')) {
            const [first, ...rest] = message.split('\n');
            if (trace) {
              rest.push(trace);
            }
            message = first;
            trace = rest.join('\n').trimStart();
          }

          allure.statusDetails({ message, trace });
        }
      }
    }

    const [attachmentResult] = await Promise.all([
      viewHierarchy?.attachFromResult(allure, result),
      logs?.attachAfterFailure(allure),
    ]);

    if (!attachmentResult?.screenshotsAttached) {
      await screenshots?.attachFailure(allure);
    }
  };

  return async (...args: any[]) => {
    const desc = descriptionMaker(args[0]);
    return desc?.message
      ? allure.step(desc.message, async () => {
          if (desc.args) allure.parameters(desc.args);
          logs?.attachBefore(allure);
          await videoManager?.ensureRecording();

          try {
            const result = await send(...args);
            await (result?.type === 'testFailed'
              ? onActionFailure(true, result as DetoxTestFailedResult)
              : onActionSuccess(desc.args, result as DetoxInvokeResult));
            return result;
          } catch (error) {
            await onActionFailure(false);
            throw error;
          }
        })
      : send(...args);
  };
}
