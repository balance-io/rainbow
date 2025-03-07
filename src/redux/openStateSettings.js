import produce from 'immer';
import {
  getOpenFamilies,
  getOpenInvestmentCards,
  getSmallBalanceToggle,
  saveOpenFamilies,
  saveOpenInvestmentCards,
  saveSmallBalanceToggle,
  removeOpenFamilies,
  removeOpenInvestmentCards,
  removeSmallBalanceToggle,
} from '../handlers/localstorage/accountLocal';

// -- Constants ------------------------------------------------------------- //
const OPEN_STATE_SETTINGS_LOAD_SUCCESS =
  'openStateSettings/OPEN_STATE_SETTINGS_LOAD_SUCCESS';
const OPEN_STATE_SETTINGS_LOAD_FAILURE =
  'openStateSettings/OPEN_STATE_SETTINGS_LOAD_FAILURE';
const CLEAR_OPEN_STATE_SETTINGS = 'openStateSettings/CLEAR_OPEN_STATE_SETTINGS';
const PUSH_OPEN_FAMILY_TAB = 'openStateSettings/PUSH_OPEN_FAMILY_TAB';
const SET_OPEN_FAMILY_TABS = 'openStateSettings/SET_OPEN_FAMILY_TABS';
const SET_OPEN_SMALL_BALANCES = 'openStateSettings/SET_OPEN_SMALL_BALANCES';
const SET_OPEN_INVESTMENT_CARDS = 'openStateSettings/SET_OPEN_INVESTMENT_CARDS';
const PUSH_OPEN_INVESTMENT_CARD = 'openStateSettings/PUSH_OPEN_INVESTMENT_CARD';

// -- Actions --------------------------------------------------------------- //
export const openStateSettingsLoadState = () => async (dispatch, getState) => {
  try {
    const { accountAddress, network } = getState().settings;
    const openSmallBalances = await getSmallBalanceToggle(
      accountAddress,
      network
    );
    const openInvestmentCards = await getOpenInvestmentCards(
      accountAddress,
      network
    );
    const openFamilyTabs = await getOpenFamilies(accountAddress, network);
    dispatch({
      payload: {
        openFamilyTabs,
        openInvestmentCards,
        openSmallBalances,
      },
      type: OPEN_STATE_SETTINGS_LOAD_SUCCESS,
    });
  } catch (error) {
    dispatch({ type: OPEN_STATE_SETTINGS_LOAD_FAILURE });
  }
};

export const setOpenSmallBalances = payload => (dispatch, getState) => {
  const { accountAddress, network } = getState().settings;
  saveSmallBalanceToggle(payload, accountAddress, network);
  dispatch({
    payload,
    type: SET_OPEN_SMALL_BALANCES,
  });
};

export const pushOpenFamilyTab = payload => dispatch =>
  dispatch({
    payload,
    type: PUSH_OPEN_FAMILY_TAB,
  });

export const setOpenFamilyTabs = payload => (dispatch, getState) => {
  const { accountAddress, network } = getState().settings;
  const { openFamilyTabs } = getState().openStateSettings;
  const updatedFamilyTabs = {
    ...openFamilyTabs,
    [payload.index]: payload.state,
  };
  saveOpenFamilies(updatedFamilyTabs, accountAddress, network);
  dispatch({
    payload: updatedFamilyTabs,
    type: SET_OPEN_FAMILY_TABS,
  });
};

export const setOpenInvestmentCards = payload => (dispatch, getState) => {
  const { accountAddress, network } = getState().settings;
  const { openInvestmentCards } = getState().openStateSettings;
  const updatedOpenInvestmentCards = {
    ...openInvestmentCards,
    [payload.index]: payload.state,
  };
  saveOpenInvestmentCards(updatedOpenInvestmentCards, accountAddress, network);
  dispatch({
    payload: updatedOpenInvestmentCards,
    type: SET_OPEN_INVESTMENT_CARDS,
  });
};

export const pushOpenInvestmentCard = payload => dispatch =>
  dispatch({
    payload,
    type: PUSH_OPEN_INVESTMENT_CARD,
  });

export const clearOpenStateSettings = () => (dispatch, getState) => {
  const { accountAddress, network } = getState().settings;
  removeOpenFamilies(accountAddress, network);
  removeOpenInvestmentCards(accountAddress, network);
  removeSmallBalanceToggle(accountAddress, network);
  dispatch({
    type: CLEAR_OPEN_STATE_SETTINGS,
  });
};

// -- Reducer --------------------------------------------------------------- //
export const INITIAL_STATE = {
  openFamilyTabs: {},
  openInvestmentCards: {},
  openSmallBalances: false,
};

export default (state = INITIAL_STATE, action) =>
  produce(state, draft => {
    if (action.type === OPEN_STATE_SETTINGS_LOAD_SUCCESS) {
      draft.openFamilyTabs = action.payload.openFamilyTabs;
      draft.openInvestmentCards = action.payload.openInvestmentCards;
      draft.openSmallBalances = action.payload.openSmallBalances;
    } else if (action.type === SET_OPEN_FAMILY_TABS) {
      draft.openFamilyTabs = action.payload;
    } else if (action.type === PUSH_OPEN_FAMILY_TAB) {
      draft.openFamilyTabs = action.payload;
    } else if (action.type === SET_OPEN_SMALL_BALANCES) {
      draft.openSmallBalances = action.payload;
    } else if (action.type === SET_OPEN_INVESTMENT_CARDS) {
      draft.openInvestmentCards = action.payload;
    } else if (action.type === PUSH_OPEN_INVESTMENT_CARD) {
      draft.openInvestmentCards = action.payload;
    } else if (action.type === CLEAR_OPEN_STATE_SETTINGS) {
      return INITIAL_STATE;
    }
  });
