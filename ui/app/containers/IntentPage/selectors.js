import { createSelector } from 'reselect';

const selectIntent = (state) => state.intent;

const makeSelectIntentData = () => createSelector(
  selectIntent,
  (intentState) => intentState.intentData,
);

const makeSelectWindowSelection = () => createSelector(
  selectIntent,
  (intentState) => intentState.windowSelection,
);

const makeSelectScenarioData = () => createSelector(
  selectIntent,
  (scenarioState) => scenarioState.scenarioData,
);

const makeSelectTouched = () => createSelector(
  selectIntent,
  (intentState) => intentState.touched,
);

export {
  selectIntent,
  makeSelectWindowSelection,
  makeSelectIntentData,
  makeSelectScenarioData,
  makeSelectTouched,
};
