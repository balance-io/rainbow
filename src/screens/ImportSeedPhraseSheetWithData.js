import analytics from '@segment/analytics-react-native';
import { get } from 'lodash';
import { Clipboard, InteractionManager, Linking } from 'react-native';
import { withNavigation } from 'react-navigation';
import {
  compose,
  lifecycle,
  onlyUpdateForKeys,
  withHandlers,
  withProps,
  withState,
} from 'recompact';
import { Alert } from '../components/alerts';
import {
  withDataInit,
  withIsWalletEmpty,
  withIsWalletImporting,
  withAccountAddress,
} from '../hoc';
import { deviceUtils } from '../utils';
import ImportSeedPhraseSheet from './ImportSeedPhraseSheet';
import { isValidSeed as validateSeed } from '../helpers/validators';

const ConfirmImportAlert = (onSuccess, navigation) =>
  Alert({
    buttons: [
      {
        onPress: () =>
          navigation.navigate('ExpandedAssetScreen', {
            actionType: 'Import',
            address: undefined,
            asset: [],
            isCurrentProfile: false,
            isNewProfile: true,
            onCloseModal: isCanceled => (isCanceled ? null : onSuccess()),
            profile: {},
            type: 'profile_creator',
          }),
        text: 'Import As New Wallet',
      },
      {
        style: 'cancel',
        text: 'Cancel',
      },
    ],
    message:
      'Importing this private key will create new wallet. You can switch between your existing wallets in the menu on the top of profile screen.',
    title: 'Are you sure you want to import new wallet?',
  });

const ImportSeedPhraseSheetWithData = compose(
  withAccountAddress,
  withDataInit,
  withIsWalletEmpty,
  withIsWalletImporting,
  withNavigation,
  withState('clipboardContents', 'setClipboardContents', ''),
  withState('seedPhrase', 'setSeedPhrase', ''),
  withHandlers({
    importSeedPhrase: ({
      initializeWallet,
      isEmpty,
      navigation,
      seedPhrase,
      setIsWalletImporting,
    }) => async () => {
      try {
        const address = await initializeWallet(seedPhrase.trim());
        if (address) {
          analytics.track('Imported seed phrase', {
            hadPreviousAddressWithValue: isEmpty,
          });
          setIsWalletImporting(false);
          navigation.navigate('WalletScreen');
        } else {
          setIsWalletImporting(false);
        }
      } catch (error) {
        setIsWalletImporting(false);
        console.error('error importing seed phrase: ', error);
      }
    },
  }),
  withHandlers({
    getClipboardContents: ({ setClipboardContents }) => async () =>
      Clipboard.getString().then(setClipboardContents),
    onImportSeedPhrase: ({ setIsWalletImporting, navigation }) => () =>
      ConfirmImportAlert(
        () =>
          setTimeout(() => {
            setIsWalletImporting(true);
          }, 20),
        navigation
      ),
    onInputChange: ({ isImporting, setSeedPhrase }) => ({ nativeEvent }) => {
      if (!isImporting) {
        setSeedPhrase(nativeEvent.text);
      }
    },
    onPasteSeedPhrase: ({ setSeedPhrase }) => () => {
      Clipboard.getString()
        .then(setSeedPhrase)
        .catch(error => console.log(error));
    },
    onPressHelp: () => () => Linking.openURL('http://rainbow.me'),
  }),
  withProps(({ clipboardContents, seedPhrase }) => ({
    isClipboardContentsValidSeedPhrase: validateSeed(clipboardContents),
    isSeedPhraseValid: validateSeed(seedPhrase),
  })),
  onlyUpdateForKeys([
    'isClipboardContentsValidSeedPhrase',
    'isImporting',
    'isSeedPhraseValid',
    'seedPhrase',
  ]),
  lifecycle({
    componentDidMount() {
      this.props.getClipboardContents();
    },
    componentDidUpdate(prevProps) {
      const {
        getClipboardContents,
        importSeedPhrase,
        isImporting,
        navigation,
      } = this.props;

      getClipboardContents();

      if (isImporting !== prevProps.isImporting) {
        navigation.setParams({ gesturesEnabled: !isImporting });
      }

      if (!prevProps.isImporting && isImporting) {
        setTimeout(() => {
          importSeedPhrase();
        }, 20);
      }
    },
  }),
  withHandlers({
    onPressEnterKey: ({ onImportSeedPhrase, seedPhrase }) => () => {
      if (seedPhrase) {
        onImportSeedPhrase();
      }
    },
  })
)(ImportSeedPhraseSheet);

ImportSeedPhraseSheetWithData.navigationOptions = ({ navigation }) => ({
  gestureResponseDistance: {
    vertical: deviceUtils.dimensions.height / 2,
  },
  gesturesEnabled: get(navigation, 'state.params.gesturesEnabled', true),
});

export default ImportSeedPhraseSheetWithData;
