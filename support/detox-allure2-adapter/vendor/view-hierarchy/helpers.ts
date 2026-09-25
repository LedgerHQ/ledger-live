import fs from 'node:fs/promises';

// eslint-disable-next-line import/no-internal-modules
import type { AllureRuntime, ContentAttachmentHandler } from '@support/jest-allure2-reporter/api';

import type { ViewHierarchyHandlerFactory } from '../file-handlers';
import type { ScreenshotHelper } from '../screenshots';
import type { OnErrorHandlerFn } from '../types';
import type { DetoxTestFailedResult } from '../utils';
import { ScreenshotsCollector } from './screenshots-collector';

const POINTER_REGEX = /(0x[\da-f]+)/;

export interface ViewHierarchyHelperConfig {
  createContentHandler: ViewHierarchyHandlerFactory;
  screenshotsHelper: ScreenshotHelper;
  onError: OnErrorHandlerFn;
}

/**
 * Helper class for handling viewHierarchy XML data from test failures
 */
export class ViewHierarchyHelper {
  public readonly defaultHandler: ContentAttachmentHandler;

  private readonly _screenshotsCollector: ScreenshotsCollector;
  private readonly _handleError: OnErrorHandlerFn;
  private readonly _createContentHandler: ViewHierarchyHandlerFactory;

  constructor({ createContentHandler, screenshotsHelper, onError }: ViewHierarchyHelperConfig) {
    this._createContentHandler = createContentHandler;
    this._handleError = onError;
    this._screenshotsCollector = new ScreenshotsCollector({
      onError,
      screenshotsHelper,
    });

    this.defaultHandler = this._createContentHandler();
  }

  /**
   * Attach various failure artifacts from the test result payload to the Allure report.
   * This includes the interactive view hierarchy, native view hierarchy zip, and any failure screenshots.
   *
   * @returns An object indicating what was attached, e.g. { screenshotsAttached: boolean; viewHierarchyAttached: boolean; }.
   */
  async attachFromResult(
    allure: AllureRuntime,
    result: DetoxTestFailedResult | undefined,
  ): Promise<{ screenshotsAttached: boolean; viewHierarchyAttached: boolean }> {
    const defaultResponse = { screenshotsAttached: false, viewHierarchyAttached: false };
    const params = result?.params;
    if (!params) {
      return defaultResponse;
    }

    // First, get the screenshot content to avoid race conditions with file moving.
    const screenshotBase64 = params.viewHierarchy
      ? await this._screenshotsCollector.getBase64Screenshot(params.visibilityFailingScreenshotsURL)
      : undefined;

    // Now, all attachment operations can run in parallel.
    const [interactiveAttached, nativeAttached, screenshotsAttached] = await Promise.all([
      this.attachInteractiveViewHierarchy(allure, params, screenshotBase64),
      this.attachNativeViewHierarchy(allure, params.viewHierarchyURL),
      this._screenshotsCollector.attachAllScreenshots(
        allure,
        params.visibilityFailingScreenshotsURL,
      ),
      this._screenshotsCollector.attachAllScreenshots(allure, params.visibilityFailingRectsURL),
    ]);

    return {
      screenshotsAttached: screenshotsAttached || !!screenshotBase64,
      viewHierarchyAttached: interactiveAttached || nativeAttached,
    };
  }

  private async attachInteractiveViewHierarchy(
    allure: AllureRuntime,
    params: DetoxTestFailedResult['params'],
    screenshotBase64?: string,
  ): Promise<boolean> {
    if (!params.viewHierarchy) {
      return false;
    }

    allure.attachment('viewhierarchy.xml', params.viewHierarchy, {
      /**
       * @todo change to application/xhtml+xml when this PR is merged:
       * @link https://github.com/allure-framework/allure2/pull/3133
       */
      mimeType: 'text/html',
      handler: this._createContentHandler({
        screenshot: screenshotBase64,
        activePointer: this.extractPointer(params.viewDescription),
        errorMessage: params.details,
      }),
    });

    return true;
  }

  private async attachNativeViewHierarchy(
    allure: AllureRuntime,
    dirPath?: string,
  ): Promise<boolean> {
    if (!dirPath) {
      return false;
    }

    try {
      const files = await fs.readdir(dirPath);
      if (files.length === 0) {
        return false;
      }
    } catch {
      return false;
    }

    try {
      await allure.fileAttachment(dirPath, {
        name: 'ui.viewhierarchy.zip',
        mimeType: 'application/zip',
        handler: 'zip',
      });
      return true;
    } catch (error) {
      this._handleError(error as Error);
      return false;
    }
  }

  private extractPointer(str?: string): string | undefined {
    if (typeof str !== 'string') {
      return undefined;
    }

    const match = str.match(POINTER_REGEX);
    return match ? match[1] : undefined;
  }
}
