import delay from 'delay';
import { isNil } from 'lodash';
import { Alert } from 'react-native';
import { connect } from 'react-redux';
import { compose, withHandlers } from 'recompact';
import { getIsWalletEmpty } from '../handlers/localstorage/accountLocal';
import { hasEthBalance } from '../handlers/web3';
import { dataClearState, dataLoadState } from '../redux/data';
import { explorerClearState, explorerInit } from '../redux/explorer';
import { gasClearState, gasPricesInit } from '../redux/gas';
import { clearIsWalletEmpty } from '../redux/isWalletEmpty';
import { setIsWalletEthZero } from '../redux/isWalletEthZero';
import { nonceClearState } from '../redux/nonce';
import { contactsLoadState } from '../redux/contacts';
import {
  clearOpenStateSettings,
  openStateSettingsLoadState,
} from '../redux/openStateSettings';
import { requestsLoadState, requestsClearState } from '../redux/requests';
import {
  settingsLoadState,
  settingsUpdateAccountAddress,
  settingsUpdateAccountColor,
  settingsUpdateAccountName,
} from '../redux/settings';
import {
  uniswapLoadState,
  uniswapClearState,
  uniswapUpdateState,
} from '../redux/uniswap';
import {
  uniqueTokensClearState,
  uniqueTokensLoadState,
  uniqueTokensRefreshState,
} from '../redux/uniqueTokens';
import {
  web3ListenerClearState,
  web3ListenerInit,
} from '../redux/web3listener';
import {
  walletInit,
  loadUserDataForAddress,
  createWallet,
  saveWalletDetails,
  saveName,
} from '../model/wallet';
import {
  walletConnectLoadState,
  walletConnectClearState,
} from '../redux/walletconnect';
import { promiseUtils } from '../utils';
import withHideSplashScreen from './withHideSplashScreen';

const walletInitialization = async (
  isImported,
  isNew,
  walletAddress,
  ownProps
) => {
  if (isNil(walletAddress)) {
    Alert.alert(
      'Import failed due to an invalid private key. Please try again.'
    );
    return null;
  }
  if (isImported) {
    await ownProps.clearAccountData();
  }
  ownProps.settingsUpdateAccountAddress(walletAddress, 'RAINBOWWALLET');
  if (isNew) {
    ownProps.setIsWalletEthZero(true);
  } else if (isImported) {
    await ownProps.checkEthBalance(walletAddress);
  } else {
    const isWalletEmpty = await getIsWalletEmpty(walletAddress, 'mainnet');
    if (isNil(isWalletEmpty)) {
      ownProps.checkEthBalance(walletAddress);
    } else {
      ownProps.setIsWalletEthZero(isWalletEmpty);
    }
  }
  if (!(isImported || isNew)) {
    // await ownProps.loadAccountData();
  }
  ownProps.onHideSplashScreen();
  ownProps.initializeAccountData();
  return walletAddress;
};

export default Component =>
  compose(
    connect(null, {
      clearIsWalletEmpty,
      clearOpenStateSettings,
      contactsLoadState,
      dataClearState,
      dataLoadState,
      explorerClearState,
      explorerInit,
      gasClearState,
      gasPricesInit,
      nonceClearState,
      openStateSettingsLoadState,
      requestsClearState,
      requestsLoadState,
      setIsWalletEthZero,
      settingsLoadState,
      settingsUpdateAccountAddress,
      settingsUpdateAccountColor,
      settingsUpdateAccountName,
      uniqueTokensClearState,
      uniqueTokensLoadState,
      uniqueTokensRefreshState,
      uniswapClearState,
      uniswapLoadState,
      uniswapUpdateState,
      walletConnectClearState,
      walletConnectLoadState,
      web3ListenerInit,
    }),
    withHideSplashScreen,
    withHandlers({
      checkEthBalance: ownProps => async walletAddress => {
        try {
          const ethBalance = await hasEthBalance(walletAddress);
          ownProps.setIsWalletEthZero(!ethBalance);
        } catch (error) {
          console.log('Error: Checking eth balance', error);
        }
      },
      clearAccountData: ownProps => async () => {
        web3ListenerClearState();
        const p0 = ownProps.explorerClearState();
        const p1 = ownProps.clearIsWalletEmpty();
        const p3 = ownProps.walletConnectClearState();
        const p4 = ownProps.nonceClearState();
        const p5 = ownProps.requestsClearState();
        const p6 = ownProps.gasClearState();
        return promiseUtils.PromiseAllWithFails([p0, p1, p3, p4, p5, p6]);
      },
      initializeAccountData: ownProps => async () => {
        try {
          // TODO EXPLORE THIS FUNCTION
          ownProps.explorerInit();
          ownProps.gasPricesInit();
          ownProps.web3ListenerInit();
          await ownProps.uniqueTokensRefreshState();
        } catch (error) {
          // TODO error state
          console.log('Error initializing account data: ', error);
        }
      },
      loadAccountData: ownProps => async () => {
        await ownProps.openStateSettingsLoadState();
        const p1 = ownProps.settingsLoadState();
        const p2 = ownProps.dataLoadState();
        const p3 = ownProps.uniqueTokensLoadState();
        const p4 = ownProps.walletConnectLoadState();
        const p5 = ownProps.uniswapLoadState();
        const p6 = ownProps.requestsLoadState();
        const p7 = ownProps.contactsLoadState();
        return promiseUtils.PromiseAllWithFails([p1, p2, p3, p4, p5, p6, p7]);
      },
      refreshAccountData: ownProps => async () => {
        try {
          const getUniswap = ownProps.uniswapUpdateState();
          const getUniqueTokens = ownProps.uniqueTokensRefreshState();

          return Promise.all([
            delay(1250), // minimum duration we want the "Pull to Refresh" animation to last
            getUniswap,
            getUniqueTokens,
          ]);
        } catch (error) {
          console.log('Error refreshing data', error);
          throw error;
        }
      },
    }),
    withHandlers({
      createNewWallet: ownProps => async () => {
        try {
          const name = ownProps.accountName || 'My Wallet';
          const color = ownProps.accountColor || 0;
          const walletAddress = await createWallet(false, name, color);
          await ownProps.settingsUpdateAccountName(name);
          ownProps.settingsUpdateAccountColor(color);

          await ownProps.uniqueTokensLoadState(walletAddress);
          await ownProps.dataLoadState(walletAddress);
          await ownProps.uniswapLoadState(walletAddress);

          return await walletInitialization(
            false,
            true,
            walletAddress,
            ownProps
          );
        } catch (error) {
          ownProps.onHideSplashScreen();
          Alert.alert('Something went wrong during wallet creation process.');
          return null;
        }
      },
      deleteWallet: ownProps => async deleteAddress => {
        try {
          await ownProps.dataClearState(deleteAddress, true);
          await ownProps.uniqueTokensClearState(deleteAddress);
          await ownProps.uniswapClearState(deleteAddress);

          return true;
        } catch (error) {
          ownProps.onHideSplashScreen();
          return null;
        }
      },
      initializeWallet: ownProps => async seedPhrase => {
        try {
          const { isImported, isNew, walletAddress } = await walletInit(
            seedPhrase,
            ownProps.accountName,
            ownProps.accountColor
          );
          let name = ownProps.accountName ? ownProps.accountName : 'My Wallet';
          let color = ownProps.accountColor ? ownProps.accountColor : 0;
          // await ownProps.openStateSettingsLoadState();
          if (!ownProps.accountName && !ownProps.accountColor) {
            const localData = await loadUserDataForAddress(walletAddress);
            if (localData) {
              name = localData.searchedName;
              color = localData.searchedColor;
            }
          }

          await ownProps.settingsUpdateAccountName(name);
          ownProps.settingsUpdateAccountColor(color);

          await ownProps.uniqueTokensLoadState(walletAddress);
          await ownProps.dataLoadState(walletAddress);
          await ownProps.uniswapLoadState(walletAddress);

          return await walletInitialization(
            isImported,
            isNew,
            walletAddress,
            ownProps
          );
        } catch (error) {
          // TODO specify error states more granular
          ownProps.onHideSplashScreen();
          Alert.alert(
            'Import failed due to an invalid private key. Please try again.'
          );
          return null;
        }
      },
      initializeWalletWithProfile: ownProps => async (
        isImported,
        isNew,
        profile
      ) => {
        try {
          saveWalletDetails(
            profile.name,
            profile.color,
            profile.seedPhrase,
            profile.privateKey,
            profile.address
          );
          await ownProps.settingsUpdateAccountName(profile.name);
          ownProps.settingsUpdateAccountColor(profile.color);
          saveName(profile.name);

          await ownProps.uniqueTokensLoadState(profile.address);
          await ownProps.dataLoadState(profile.address);
          await ownProps.uniswapLoadState(profile.address);

          return await walletInitialization(
            isImported,
            isNew,
            profile.address,
            ownProps
          );
        } catch (error) {
          // TODO specify error states more granular
          ownProps.onHideSplashScreen();
          return null;
        }
      },
    })
  )(Component);
