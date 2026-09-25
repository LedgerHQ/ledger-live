import type { StepDescription, StepDescriptionFriendly } from '../../types';
import { concat, glue, msg } from '../../utils';
import { DetoxMatcher } from './DetoxMatcher';
import { DetoxWebAtomMatcher } from './DetoxWebAtomMatcher';

export class EspressoWebDetox {
  static getWebView(matcher?: DetoxMatcher): GetWebViewResult {
    return new GetWebViewResult(matcher);
  }

  static expect(webElement: ElementResult): ExpectResult {
    return new ExpectResult(webElement);
  }
}

class GetWebViewResult implements StepDescriptionFriendly {
  constructor(private readonly matcher?: DetoxMatcher) {}

  element(matcher: DetoxWebAtomMatcher, index?: number): ElementResult {
    return new ElementResult(this, matcher, index);
  }

  toJSON(): StepDescription {
    return this.matcher ? glue('WebView ', this.matcher, ':') : msg('WebView:');
  }
}

class ExpectResult {
  constructor(private readonly webElement: ElementResult) {}

  toExist(): StepDescription {
    return concat(this.webElement.webview, 'Expect', this.webElement.matcher, 'to exist');
  }

  toHaveText(text: string): StepDescription {
    return concat(
      this.webElement.webview,
      'Expect',
      this.webElement.matcher,
      msg(`to have text "${text}"`, { expected_text: text }),
    );
  }

  toNotExist(): StepDescription {
    return concat(this.webElement.webview, 'Expect', this.webElement.matcher, 'not to exist');
  }
}

export class ElementResult {
  public readonly matcher: StepDescription;
  public readonly webview: GetWebViewResult;

  constructor(webview: GetWebViewResult, matcher: DetoxWebAtomMatcher, index?: number) {
    this.webview = webview;
    this.matcher = glue(matcher, ElementResult.formatIndex(index));
  }

  private static formatIndex(index?: number): StepDescription | null {
    return Number.isFinite(index) ? msg(`[${index}]`, { web_index: index }) : null;
  }

  getText(): StepDescription {
    return concat(this.webview, 'Get text from', this.matcher);
  }

  tap(): StepDescription {
    return concat(this.webview, 'Tap', this.matcher);
  }

  replaceText(text: string): StepDescription {
    return concat(
      this.webview,
      'Replace text in',
      this.matcher,
      'with',
      msg(JSON.stringify(text), { text }),
    );
  }

  clearText(): StepDescription {
    return concat(this.webview, 'Clear text in', this.matcher);
  }

  getTitle(): StepDescription {
    return concat(this.webview, 'Get title of', this.matcher);
  }

  typeText(text: string): StepDescription {
    return concat(this.webview, 'Type', msg(JSON.stringify(text), { text }), 'in', this.matcher);
  }

  getCurrentUrl(): StepDescription {
    return concat(this.webview, 'Get current URL from', this.matcher);
  }

  runScript(script: string): StepDescription {
    return concat(this.webview, msg('Run script on', { script }), this.matcher);
  }

  runScriptWithArgs(script: string, args: unknown[]): StepDescription {
    return concat(this.webview, msg('Run script with args on', { args, script }), this.matcher);
  }

  scrollToView(): StepDescription {
    return concat(this.webview, 'Scroll to', this.matcher);
  }
}
