// Import all class implementations
import { Detox } from './Detox';
import { DetoxAction } from './DetoxAction';
import { DetoxAssertion } from './DetoxAssertion';
import { DetoxGenymotionManager } from './DetoxGenymotionManager';
import { DetoxMatcher } from './DetoxMatcher';
import { DetoxViewActions } from './DetoxViewActions';
import { DetoxWebAtomMatcher } from './DetoxWebAtomMatcher';
import { Espresso } from './Espresso';
import { EspressoDetox } from './EspressoDetox';
import { EspressoWebDetox } from './EspressoWebDetox';
import { UiAutomator } from './UiAutomator';
import { ViewActions } from './ViewActions';

// Export all classes for individual imports if needed

// Build and export the class registry
export const classRegistry: Record<string, any> = {
  'androidx.test.espresso.Espresso': Espresso,
  'androidx.test.espresso.action.ViewActions': ViewActions,
  'com.wix.detox.Detox': Detox,
  'com.wix.detox.espresso.DetoxAction': DetoxAction,
  'com.wix.detox.espresso.DetoxAssertion': DetoxAssertion,
  'com.wix.detox.espresso.DetoxMatcher': DetoxMatcher,
  'com.wix.detox.espresso.DetoxViewActions': DetoxViewActions,
  'com.wix.detox.espresso.EspressoDetox': EspressoDetox,
  'com.wix.detox.espresso.web.DetoxWebAtomMatcher': DetoxWebAtomMatcher,
  'com.wix.detox.espresso.web.EspressoWebDetox': EspressoWebDetox,
  'com.wix.detox.genymotion.DetoxGenymotionManager': DetoxGenymotionManager,
  'com.wix.detox.uiautomator.UiAutomator': UiAutomator,
};
