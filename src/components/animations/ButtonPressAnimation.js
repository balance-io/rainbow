import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useRef } from 'react';
import {
  createNativeWrapper,
  PureNativeButton,
  State,
} from 'react-native-gesture-handler';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import Animated, { clockRunning, Easing } from 'react-native-reanimated';
import stylePropType from 'react-style-proptype';
import { useMemoOne } from 'use-memo-one';
import { useInteraction, useTransformOrigin } from '../../hooks';
import { animations } from '../../styles';
import { directionPropType } from '../../utils';

const {
  and,
  block,
  call,
  Clock,
  cond,
  createAnimatedComponent,
  eq,
  event,
  neq,
  or,
  set,
  not,
  proc,
  startClock,
  stopClock,
  timing,
  Value,
} = Animated;

const { ACTIVE, BEGAN, CANCELLED, END, FAILED, UNDETERMINED } = State;
const ANIMATION_STATE_0 = 0;
const ANIMATION_STATE_1 = 1;
const ANIMATION_STATE_2 = 2;
const ANIMATION_STATE_3 = 3;

const AnimatedRawButton = createNativeWrapper(
  createAnimatedComponent(PureNativeButton),
  {
    shouldActivateOnStart: true,
    shouldCancelWhenOutside: true,
  }
);

function usePressHandler({
  interactionHandle = {},
  minLongPressDuration,
  onLongPress,
  onPress,
  optionallyTriggerHaptic,
}) {
  const longPressHandle = useRef();

  const createHandle = useCallback(() => {
    longPressHandle.current = setTimeout(() => {
      onLongPress();
      longPressHandle.current = null;
      optionallyTriggerHaptic();
    }, minLongPressDuration);
  }, [minLongPressDuration, onLongPress, optionallyTriggerHaptic]);

  const handlePress = useCallback(() => {
    if (onLongPress && !longPressHandle.current) return;
    onPress && onPress();
    optionallyTriggerHaptic();
  }, [longPressHandle, onLongPress, onPress, optionallyTriggerHaptic]);

  const removeHandle = useCallback(() => {
    if (interactionHandle.current) {
      clearTimeout(longPressHandle.current);
      longPressHandle.current = null;
    }
  }, [interactionHandle]);

  useEffect(() => () => removeHandle());
  return [handlePress, createHandle, removeHandle];
}

const ButtonPressAnimationProc2 = proc(function(
  animationState,
  durationVal,
  finished,
  frameTime,
  gestureState,
  onGestureEvent,
  prevGestureState,
  scaleValue,
  time,
  toValue,
  zoomClock,
  scaleTo,
  onPressCall,
  onPressStartCall,
  onLongPressCall,
  interactionCall
) {
  return block([
    cond(neq(prevGestureState, gestureState), [
      cond(
        or(
          eq(gestureState, ACTIVE),
          and(neq(prevGestureState, ACTIVE), eq(gestureState, UNDETERMINED))
        ),
        [set(animationState, ANIMATION_STATE_0)]
      ),
      cond(eq(gestureState, END), onPressCall),
      cond(eq(gestureState, ACTIVE), [
        onLongPressCall,
        interactionCall,
        onPressStartCall,
      ]),
    ]),
    set(prevGestureState, gestureState),
    cond(eq(animationState, ANIMATION_STATE_0), [
      startClock(zoomClock),
      set(finished, 0),
      set(animationState, ANIMATION_STATE_1),
      set(frameTime, 0),
      set(time, 0),
      set(toValue, scaleTo),
    ]),
    cond(
      and(
        eq(animationState, ANIMATION_STATE_1),
        neq(gestureState, ACTIVE),
        finished
      ),
      [
        set(finished, 0),
        set(animationState, ANIMATION_STATE_2),
        set(frameTime, 0),
        set(time, 0),
        set(toValue, 1),
      ]
    ),
    cond(and(eq(animationState, ANIMATION_STATE_2), finished), [
      set(animationState, ANIMATION_STATE_3),
      stopClock(zoomClock),
    ]),
    cond(
      or(
        eq(animationState, ANIMATION_STATE_1),
        eq(animationState, ANIMATION_STATE_2)
      ),
      timing(
        zoomClock,
        {
          finished,
          frameTime,
          position: scaleValue,
          time,
        },
        {
          duration: durationVal,
          easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
          toValue,
        }
      )
    ),
    scaleValue,
  ]);
});

const ButtonPressAnimationProc1 = proc(function(
  animationState,
  gestureState,
  prevGestureState,
  zoomClock
) {
  return block([
    cond(
      and(
        eq(gestureState, END),
        eq(prevGestureState, END),
        not(clockRunning(zoomClock))
      ),
      set(prevGestureState, UNDETERMINED)
    ),
  ]);
});

export default function ButtonPressAnimation({
  activeOpacity,
  children,
  disabled,
  duration,
  enableHapticFeedback,
  hapticType,
  isInteraction,
  minLongPressDuration,
  onLongPress,
  onPress,
  onPressStart,
  scaleTo,
  style,
  transformOrigin,
}) {
  const [interactionHandle, createHandle, removeHandle] = useInteraction();
  const { onLayout, withTransformOrigin } = useTransformOrigin(transformOrigin);

  const optionallyTriggerHaptic = useCallback(() => {
    if (enableHapticFeedback) {
      ReactNativeHapticFeedback.trigger(hapticType);
    }
  }, [enableHapticFeedback, hapticType]);

  const [
    handlePress,
    createLongPressHandle,
    removeLongPressHandle,
  ] = usePressHandler({
    interactionHandle,
    minLongPressDuration,
    onLongPress,
    onPress,
    optionallyTriggerHaptic,
  });

  const {
    animationState,
    durationVal,
    finished,
    frameTime,
    gestureState,
    onGestureEvent,
    prevGestureState,
    scaleValue,
    time,
    toValue,
    zoomClock,
  } = useMemoOne(() => {
    const gestureState = new Value(UNDETERMINED);
    const onGestureEvent = event([
      {
        nativeEvent: {
          state: gestureState,
        },
      },
    ]);

    return {
      animationState: new Value(CANCELLED),
      durationVal: new Value(duration),
      finished: new Value(0),
      frameTime: new Value(0),
      gestureState,
      onGestureEvent,
      prevGestureState: new Value(UNDETERMINED),
      scaleValue: new Value(1),
      time: new Value(0),
      toValue: new Value(0.5),
      zoomClock: new Clock(),
    };
  }, []);

  const scale = useRef(
    block([
      ButtonPressAnimationProc1(
        animationState,
        gestureState,
        prevGestureState,
        zoomClock
      ),
      cond(
        and(
          eq(prevGestureState, UNDETERMINED),
          eq(gestureState, END),
          neq(animationState, ANIMATION_STATE_0)
        ),
        set(animationState, ANIMATION_STATE_0)
      ),
      ButtonPressAnimationProc2(
        animationState,
        durationVal,
        finished,
        frameTime,
        gestureState,
        onGestureEvent,
        prevGestureState,
        scaleValue,
        time,
        toValue,
        zoomClock,
        scaleTo,
        call([], handlePress),
        call([], () => onPressStart && onPressStart()),
        call([gestureState], ([gs]) => {
          if (!onLongPress) {
            return;
          }
          if (gs === ACTIVE) {
            createLongPressHandle();
          } else {
            removeLongPressHandle();
          }
        }),
        call([gestureState], ([gs]) => {
          if (!isInteraction) {
            return;
          }
          if (gs === ACTIVE) {
            createHandle();
          } else {
            removeHandle();
          }
        })
      ),
    ])
  ).current;

  return (
    <AnimatedRawButton
      enabled={!disabled}
      onHandlerStateChange={onGestureEvent}
    >
      <Animated.View
        accessible
        onLayout={onLayout}
        style={[
          style,
          {
            opacity: scaleValue.interpolate({
              inputRange: scaleTo > 1 ? [1, scaleTo] : [scaleTo, 1],
              outputRange:
                scaleTo > 1 ? [1, activeOpacity] : [activeOpacity, 1],
            }),
            transform: withTransformOrigin({ scale }),
          },
        ]}
      >
        {children}
      </Animated.View>
    </AnimatedRawButton>
  );
}

ButtonPressAnimation.propTypes = {
  activeOpacity: PropTypes.number,
  children: PropTypes.any,
  disabled: PropTypes.bool,
  duration: PropTypes.number,
  enableHapticFeedback: PropTypes.bool,
  hapticType: PropTypes.string,
  isInteraction: PropTypes.bool,
  minLongPressDuration: PropTypes.number,
  onLongPress: PropTypes.func,
  onPress: PropTypes.func,
  onPressStart: PropTypes.func,
  scaleTo: PropTypes.number,
  style: stylePropType,
  transformOrigin: directionPropType,
};

ButtonPressAnimation.defaultProps = {
  activeOpacity: 1,
  duration: 160,
  enableHapticFeedback: true,
  hapticType: 'selection',
  minLongPressDuration: 500,
  scaleTo: animations.keyframes.button.to.scale,
};
