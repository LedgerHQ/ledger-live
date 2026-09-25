import type { StepDescription, StepDescriptionFriendly } from '../../types';
import { msg } from '../../utils';

type DetoxWebAtomMatcherKind =
  | 'id'
  | 'class'
  | 'css'
  | 'name'
  | 'xpath'
  | 'linkText'
  | 'partialLinkText'
  | 'tag';

export class DetoxWebAtomMatcher implements StepDescriptionFriendly {
  constructor(
    private readonly kind: DetoxWebAtomMatcherKind,
    private readonly value: string,
  ) {}

  static matcherForId(id: string): DetoxWebAtomMatcher {
    return new DetoxWebAtomMatcher('id', id);
  }

  static matcherForClassName(className: string): DetoxWebAtomMatcher {
    return new DetoxWebAtomMatcher('class', className);
  }

  static matcherForCssSelector(cssSelector: string): DetoxWebAtomMatcher {
    return new DetoxWebAtomMatcher('css', cssSelector);
  }

  static matcherForName(name: string): DetoxWebAtomMatcher {
    return new DetoxWebAtomMatcher('name', name);
  }

  static matcherForXPath(xpath: string): DetoxWebAtomMatcher {
    return new DetoxWebAtomMatcher('xpath', xpath);
  }

  static matcherForLinkText(linkText: string): DetoxWebAtomMatcher {
    return new DetoxWebAtomMatcher('linkText', linkText);
  }

  static matcherForPartialLinkText(partialLinkText: string): DetoxWebAtomMatcher {
    return new DetoxWebAtomMatcher('partialLinkText', partialLinkText);
  }

  static matcherForTagName(tag: string): DetoxWebAtomMatcher {
    return new DetoxWebAtomMatcher('tag', tag);
  }

  toJSON(): StepDescription {
    switch (this.kind) {
      case 'id': {
        return msg(`#${this.value}`, { web_id: this.value });
      }
      case 'class': {
        return msg(`.${this.value}`, { web_class: this.value });
      }
      case 'css': {
        return msg(this.value, { web_selector: this.value });
      }
      case 'name': {
        return msg(`[name="${this.value}"]`, { web_name: this.value });
      }
      case 'xpath': {
        return msg(`xpath: ${this.value}`, { web_xpath: this.value });
      }
      case 'linkText': {
        return msg(`link "${this.value}"`, { web_text: this.value });
      }
      case 'partialLinkText': {
        return msg(`link containing "${this.value}"`, { web_text: this.value });
      }
      case 'tag': {
        return msg(this.value, { web_tag: this.value });
      }
    }
  }
}
