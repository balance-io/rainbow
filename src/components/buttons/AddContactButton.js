import PropTypes from 'prop-types';
import React, { useEffect, useRef } from 'react';
import FastImage from 'react-native-fast-image';
import { Transitioning, Transition } from 'react-native-reanimated';
import { View } from 'react-primitives';
import { compose, setPropTypes } from 'recompact';
import AddContactIcon from '../../assets/addContactIcon.png';
import { withNeverRerender } from '../../hoc';
import { colors } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import { Icon } from '../icons';
import Button from './Button';

const duration = 200;
const transition = (
  <Transition.Sequence>
    <Transition.Together>
      <Transition.Out
        durationMs={duration * 0.666}
        interpolation="easeIn"
        type="fade"
      />
      <Transition.Out
        durationMs={duration * 0.42}
        interpolation="easeIn"
        type="slide-right"
      />
    </Transition.Together>
    <Transition.Change durationMs={duration} interpolation="easeInOut" />
    <Transition.Together>
      <Transition.In
        durationMs={duration}
        interpolation="easeOut"
        type="fade"
      />
      <Transition.In
        durationMs={duration * 0.5}
        interpolation="easeOut"
        type="slide-right"
      />
    </Transition.Together>
  </Transition.Sequence>
);

const enhanceButton = compose(
  setPropTypes({ onPress: PropTypes.func.isRequired }),
  withNeverRerender
);

const AddButton = enhanceButton(({ onPress }) => (
  <Button
    backgroundColor={colors.sendScreen.brightBlue}
    onPress={onPress}
    size="small"
    type="pill"
  >
    <FastImage
      source={AddContactIcon}
      style={{
        height: 14.7,
        margin: 1.525,
        width: 19,
      }}
    />
  </Button>
));

const EditButton = enhanceButton(({ onPress }) => (
  <ButtonPressAnimation
    activeOpacity={0.2}
    onPress={onPress}
    style={{
      height: 30,
      justifyContent: 'center',
      paddingRight: 4,
    }}
  >
    <Icon name="threeDots" />
  </ButtonPressAnimation>
));

const AddContactButton = ({ edit, onPress }) => {
  const addButtonRef = useRef();
  const editButtonRef = useRef();

  useEffect(() => {
    if (addButtonRef.current) addButtonRef.current.animateNextTransition();
    if (editButtonRef.current) editButtonRef.current.animateNextTransition();
  }, [edit]);

  return (
    <View>
      {edit ? (
        <Transitioning.View ref={editButtonRef} transition={transition}>
          <EditButton onPress={onPress} />
        </Transitioning.View>
      ) : (
        <Transitioning.View ref={addButtonRef} transition={transition}>
          <AddButton onPress={onPress} />
        </Transitioning.View>
      )}
    </View>
  );
};

AddContactButton.propTypes = {
  edit: PropTypes.bool,
  onPress: PropTypes.func.isRequired,
};

export default React.memo(AddContactButton);
