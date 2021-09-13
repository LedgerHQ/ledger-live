import React from "react";
import { storiesOf } from '@storybook/react-native';
import {withKnobs, number, boolean} from '@storybook/addon-knobs';
import Loader from '@components/Loader';
import CenterView from '../CenterView';

storiesOf('Loader', module)
  .addDecorator(withKnobs)
  .addDecorator(getStory => <CenterView>{getStory()}</CenterView>)
  .add('default', () => (
    <Loader progress={number('progress', 0.2)} onPress={boolean('clickable', true) ? () => console.log('click') : undefined}  displayCancelIcon={boolean('displayCancelIcon', true)}>
    </Loader>
  ));
