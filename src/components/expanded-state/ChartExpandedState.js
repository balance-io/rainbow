import { get } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { InteractionManager } from 'react-native';
import {
  compose,
  onlyUpdateForKeys,
  withHandlers,
  withProps,
} from 'recompact';
import styled from 'styled-components/primitives';
import { withAccountData, withAccountSettings } from '../../hoc';
import { ethereumUtils } from '../../utils';
import { AssetPanel, AssetPanelHeader } from './asset-panel';
import FloatingPanels from './FloatingPanels';
import ValueChart from '../value-chart/ValueChart';

const ChartContainer = styled.View`
  height: 330px;
  border-radius: 20;
  justify-content: center;
  align-items: center;
`;


const TokenExpandedState = ({
  onPressSend,
  price,
  subtitle,
  title,
}) => (
  <FloatingPanels>
    <AssetPanel>
      <AssetPanelHeader
        price={price}
        subtitle={subtitle}
        title={title}
      />
      <ChartContainer>
        <ValueChart />
      </ChartContainer>
    </AssetPanel>
  </FloatingPanels>
);

TokenExpandedState.propTypes = {
  onPressSend: PropTypes.func,
  price: PropTypes.string,
  subtitle: PropTypes.string,
  title: PropTypes.string,
};

export default compose(
  withAccountData,
  withAccountSettings,
  withProps(({
    asset: {
      address,
      name,
      symbol,
      ...asset
    },
    assets,
    nativeCurrencySymbol,
  }) => {
    const selectedAsset = ethereumUtils.getAsset(assets, address);
    return {
      price: get(selectedAsset, 'native.price.display', null),
      subtitle: get(selectedAsset, 'balance.display', symbol),
      title: name,
    };
  }),
  withHandlers({
    onPressSend: ({ navigation, asset }) => () => {
      navigation.goBack();

      InteractionManager.runAfterInteractions(() => {
        navigation.navigate('SendSheet', { asset });
      });
    },
  }),
  onlyUpdateForKeys(['price', 'subtitle']),
)(TokenExpandedState);
