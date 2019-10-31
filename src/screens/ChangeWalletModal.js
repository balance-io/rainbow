import PropTypes from 'prop-types';
import React from 'react';
import { View } from 'react-native';
import { orderBy } from 'lodash';
import { compose, lifecycle, withHandlers, withState } from 'recompact';
import { withNavigation } from 'react-navigation';
import { Modal, LoadingOverlay } from '../components/modal';
import {
  withDataInit,
  withIsWalletImporting,
  withAccountAddress,
} from '../hoc';
import ProfileList from '../components/change-wallet/ProfileList';
import { removeFirstEmojiFromString } from '../helpers/emojiHandler';

const headerHeight = 68;
const profileRowHeight = 54;

const ChangeWalletModal = ({
  accountAddress,
  currentProfile,
  isChangingWallet,
  isCreatingWallet,
  isInitializationOver,
  navigation,
  onChangeWallet,
  onCloseEditProfileModal,
  onCloseModal,
  onPressBack,
  onPressCreateWallet,
  onPressImportSeedPhrase,
  onPressSection,
  profiles,
}) => {
  const size = profiles ? profiles.length - 1 : 0;
  let listHeight = profileRowHeight * 2 + profileRowHeight * size;
  if (listHeight > 258) {
    listHeight = 258;
  }
  return (
    <View>
      {isCreatingWallet && <LoadingOverlay title="Creating Wallet..." />}
      <Modal
        fixedToTop
        height={headerHeight + listHeight}
        onCloseModal={onCloseModal}
        style={{ borderRadius: 18 }}
      >
        <ProfileList
          currentProfile={currentProfile}
          accountAddress={accountAddress}
          allAssets={profiles}
          height={listHeight}
          onChangeWallet={onChangeWallet}
          onCloseEditProfileModal={onCloseEditProfileModal}
          onPressCreateWallet={onPressCreateWallet}
          onPressImportSeedPhrase={onPressImportSeedPhrase}
          isInitializationOver={isInitializationOver}
        />
      </Modal>
    </View>
  );
};

ChangeWalletModal.propTypes = {
  accountAddress: PropTypes.string,
  currentProfile: PropTypes.object,
  isChangingWallet: PropTypes.bool,
  isCreatingWallet: PropTypes.bool,
  isInitializationOver: PropTypes.bool,
  navigation: PropTypes.object,
  onChangeWallet: PropTypes.func,
  onCloseEditProfileModal: PropTypes.func,
  onCloseModal: PropTypes.func,
  onPressBack: PropTypes.func,
  onPressCreateWallet: PropTypes.func,
  onPressImportSeedPhrase: PropTypes.func,
  onPressSection: PropTypes.func,
  profiles: PropTypes.array,
};

export default compose(
  withAccountAddress,
  withDataInit,
  withNavigation,
  withIsWalletImporting,
  withState('currentProfile', 'setCurrentProfile', undefined),
  withState('profiles', 'setProfiles', undefined),
  withState('isCreatingWallet', 'setIsCreatingWallet', false),
  withState('isChangingWallet', 'setIsChangingWallet', false),
  withState('isInitializationOver', 'setIsInitializationOver', false),
  withHandlers({
    onChangeWallet: ({
      initializeWalletWithProfile,
      navigation,
      setIsWalletImporting,
      setIsChangingWallet,
    }) => async profile => {
      const setIsLoading = navigation.getParam('setIsLoading', () => null);
      setIsLoading(false);
      await setIsChangingWallet(true);
      setTimeout(async () => {
        await initializeWalletWithProfile(true, false, profile);
        // timeout that prevent ugly tansition of avatar during page transition
        setTimeout(() => {
          setIsLoading(true);
        }, 100);
        navigation.navigate('WalletScreen');
      }, 20);
    },
    onCloseEditProfileModal: ({
      setCurrentProfile,
      setProfiles,
      accountAddress,
      profiles,
    }) => async editedProfile => {
      let currentProfile = false;
      const newProfiles = profiles;
      let deleteIndex;
      if (newProfiles) {
        for (let i = 0; i < newProfiles.length; i++) {
          if (newProfiles[i].address === editedProfile.address) {
            if (editedProfile.isDeleted) {
              deleteIndex = i;
            } else {
              newProfiles[i] = editedProfile;
            }
          }
          if (newProfiles[i].address.toLowerCase() === accountAddress) {
            currentProfile = newProfiles[i];
          }
        }
      }
      if (editedProfile.isDeleted) {
        newProfiles.splice(deleteIndex, 1);
      }
      setCurrentProfile(currentProfile);
      setProfiles(
        orderBy(
          newProfiles,
          [
            profile => {
              const newEditedProfile = profile.name.toLowerCase();
              editedProfile = removeFirstEmojiFromString(newEditedProfile);
              return editedProfile;
            },
          ],
          ['asc']
        )
      );
    },
    onCloseModal: ({ navigation }) => () => navigation.goBack(),
    onPressCreateWallet: ({
      createNewWallet,
      navigation,
      clearAccountData,
      setIsCreatingWallet,
      uniswapClearState,
      uniqueTokensClearState,
    }) => () => {
      navigation.navigate('ExpandedAssetScreen', {
        actionType: 'Create',
        address: undefined,
        asset: [],
        isCurrentProfile: false,
        isNewProfile: true,
        onCloseModal: isCanceled => {
          console.log(isCanceled);
          if (!isCanceled) {
            const setIsLoading = navigation.getParam(
              'setIsLoading',
              () => null
            );
            setIsLoading(false);
            setIsCreatingWallet(true);
            setTimeout(async () => {
              await clearAccountData();
              await uniswapClearState();
              await uniqueTokensClearState();
              await createNewWallet();
              setTimeout(() => {
                setIsLoading(true);
              }, 100);
              navigation.navigate('WalletScreen');
            }, 20);
          }
        },
        profile: {},
        type: 'profile_creator',
      });
    },
    onPressImportSeedPhrase: ({ navigation, setSafeTimeout }) => () => {
      navigation.goBack();
      navigation.navigate('ImportSeedPhraseSheet');
    },
    setCurrentProfile: ({ setCurrentProfile }) => currentProfile => {
      setCurrentProfile(currentProfile);
    },
    setProfiles: ({ setProfiles }) => profiles => {
      setProfiles(profiles);
    },
  }),
  lifecycle({
    componentDidMount() {
      const profiles = this.props.navigation.getParam('profiles', []);
      this.props.setProfiles(profiles);
      let currentProfile = false;
      if (profiles) {
        for (let i = 0; i < profiles.length; i++) {
          if (profiles[i].address.toLowerCase() === this.props.accountAddress) {
            currentProfile = profiles[i];
          }
        }
      }
      this.props.setCurrentProfile(currentProfile);
      setTimeout(() => {
        this.props.setIsInitializationOver(true);
      }, 130);
    },
  })
)(ChangeWalletModal);
