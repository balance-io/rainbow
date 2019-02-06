import { isFuture } from 'date-fns';
import {
  omitBy, pickBy, forEach, mapValues, values,
} from 'lodash';
import { commonStorage } from 'balance-common';
import { AlertIOS } from 'react-native';
import lang from 'i18n-js';
import RNWalletConnect from '@walletconnect/react-native';
import { DEVICE_LANGUAGE } from '../helpers/constants';
import { getChainId } from '../model/wallet';
import { getFCMToken, checkPushNotificationPermissions } from '../model/firebase';

// -- Constants --------------------------------------- //
const WALLETCONNECT_NEW_SESSION = 'walletconnect/WALLETCONNECT_NEW_SESSION';

// -- Helpers ---------------------------------------- //

const getNativeOptions = async () => {
  const language = DEVICE_LANGUAGE.replace(/[-_](\w?)+/gi, '').toLowerCase();
  const token = await getFCMToken();

  const nativeOptions = {
    clientMeta: {
      description: 'Store and secure all your ERC-20 tokens in one place',
      url: 'https://balance.io',
      icons: ['https://avatars0.githubusercontent.com/u/19879255?s=200&v=4'],
      name: 'Balance Wallet',
      ssl: true,
    },
    push: {
      url: 'https://us-central1-balance-424a3.cloudfunctions.net',
      type: 'fcm',
      token,
      peerMeta: true,
      language,
    },
  };

  return nativeOptions;
};

// -- Actions ---------------------------------------- //

export const walletConnectInitNewSession = (accountAddress, uriString) => async dispatch => {
  let result = null;
  try {
    const nativeOptions = await getNativeOptions();
    try {
      const walletConnector = new RNWalletConnect(
        {
          uri: uriString,
        },
        nativeOptions,
      );
      const chainId = await getChainId();
      const accounts = [accountAddress];
      await walletConnector.approveSession({ chainId, accounts });
      await commonStorage.saveWalletConnectSession(walletConnector.peerId, walletConnector.session);
      result = walletConnector;
    } catch (error) {
      console.log(error);
      AlertIOS.alert(lang.t('wallet.wallet_connect.error'));
    }
  } catch (error) {
    AlertIOS.alert(lang.t('wallet.wallet_connect.missing_fcm'));
  }
  if (result) {
    await checkPushNotificationPermissions();
    dispatch(addWalletConnector(result));
  }
};

export const walletConnectInitAllConnectors = async () => {
  try {
    const allSessions = await commonStorage.getAllValidWalletConnectSessions();

    const nativeOptions = getNativeOptions();

    const allConnectors = mapValues(allSessions, session => {
      const walletConnector = new RNWalletConnect(
        {
          session,
        },
        nativeOptions,
      );
      return walletConnector;
    });
    return allConnectors;
  } catch (error) {
    AlertIOS.alert('Unable to retrieve all WalletConnect sessions.');
    return {};
  }
};

export const walletConnectDisconnectAllByDappName = async walletConnectors => {
  try {
    const peerIds = values(mapValues(walletConnectors, walletConnector => walletConnector.peerId));
    await commonStorage.removeWalletConnectSessions(peerIds);
    forEach(walletConnectors, walletConnector => walletConnector.killSession());
  } catch (error) {
    AlertIOS.alert('Failed to disconnect all WalletConnect sessions');
  }
};

export const addWalletConnector = walletConnector => (dispatch, getState) => {
  if (walletConnector) {
    const { walletConnectors } = getState().walletconnect;
    const updatedWalletConnectors = { ...walletConnectors, [walletConnector.peerId]: walletConnector };
    dispatch({ payload: updatedWalletConnectors, type: WALLETCONNECT_NEW_SESSION });
  }
};

export const getValidWalletConnectors = () => (dispatch, getState) => {
  const { walletConnectors } = getState().walletconnect;
  const validConnectors = pickBy(walletConnectors, ({ expires }) => isFuture(expires));
  dispatch({ payload: validConnectors, type: WALLETCONNECT_NEW_SESSION });
  return validConnectors;
};

export const removeWalletConnectorByDapp = dappName => (dispatch, getState) => {
  const { walletConnectors } = getState().walletconnect;
  dispatch({
    payload: omitBy(walletConnectors, ({ dappName: _dappName }) => _dappName === dappName),
    type: WALLETCONNECT_NEW_SESSION,
  });
};

export const setWalletConnectors = walletConnectors => dispatch => dispatch({
  payload: walletConnectors,
  type: WALLETCONNECT_NEW_SESSION,
});

// -- Reducer ----------------------------------------- //
const INITIAL_STATE = {
  walletConnectors: {},
};

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
  case WALLETCONNECT_NEW_SESSION:
    return { ...state, walletConnectors: action.payload };
  default:
    return state;
  }
};
