import { mapKeys, mapValues, toLower } from 'lodash';
import tokenOverridesFallback from './token-overrides.json';
import uniswapAssetsFallback from './uniswap-pairs.json';

export const DefaultUniswapFavorites = [
  // Ethereum
  'eth',
  // DAI
  '0x6b175474e89094c44da98b954eedeac495271d0f',
  // SOCKS
  '0x23B608675a2B2fB1890d3ABBd85c5775c51691d5',
];

export const loweredTokenOverridesFallback = mapKeys(
  tokenOverridesFallback,
  (_, address) => toLower(address)
);

const loweredUniswapAssetsFallback = mapKeys(
  uniswapAssetsFallback,
  (value, key) => toLower(key)
);

export const cleanUniswapAssetsFallback = mapValues(
  loweredUniswapAssetsFallback,
  (value, key) => ({
    ...value,
    ...loweredTokenOverridesFallback[key],
  })
);
