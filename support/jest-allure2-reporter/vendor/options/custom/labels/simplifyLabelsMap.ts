import type {
  KeyedLabelCustomizer,
  Label,
  MaybeArray,
  MaybeNullish,
  MaybePromise,
  PropertyExtractor,
} from '@support/jest-allure2-reporter';

import {
  asArray,
  asMaybeArray,
  compactArray,
  compactObject,
  mapValues,
  thruMaybePromise,
} from '../../../utils';
import { compose3 } from '../../common';

import { keyedLabel } from './keyedLabel';

export function simplifyLabelsMap<Context>(
  customizer: Record<string, KeyedLabelCustomizer<Context>>,
): Record<string, PropertyExtractor<Context, Label[], MaybePromise<Label[]>>> {
  return compactObject(
    mapValues(
      customizer,
      (
        value: KeyedLabelCustomizer<Context>,
        key: string,
      ): PropertyExtractor<Context, Label[], MaybePromise<Label[]>> | undefined => {
        const keyedCustomizer = keyedLabel(value);
        return keyedCustomizer
          ? compose3<
              Context,
              MaybeNullish<MaybeArray<Label>>,
              MaybeNullish<MaybeArray<string>>,
              MaybePromise<MaybeNullish<MaybeArray<string>>>,
              MaybePromise<Label[]>
            >(inflateLabels(key), keyedCustomizer, deflateLabels)
          : undefined;
      },
    ),
  );
}

function deflateLabels(context: {
  value: MaybeNullish<MaybeArray<Label>>;
}): MaybeNullish<MaybeArray<string>> {
  return asMaybeArray(asArray(context.value).map(getValue));
}

function getValue(label: Label): string {
  return label.value;
}

function inflateLabels<Context>(
  name: string,
): PropertyExtractor<
  Context,
  MaybePromise<MaybeNullish<MaybeArray<string>>>,
  MaybePromise<Label[]>
> {
  function repair(value: string | undefined): Label | undefined {
    return value ? { value, name } : undefined;
  }

  function repairMaybeArray(value: MaybeNullish<MaybeArray<string>>): Label[] {
    return compactArray(asArray(value).map(repair));
  }

  return ({ value }) => thruMaybePromise(value, repairMaybeArray);
}
