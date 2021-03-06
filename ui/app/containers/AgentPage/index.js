/**
 *
 * AgentPage
 *
 */

import { CircularProgress, Grid } from '@material-ui/core';
import PropTypes from 'prop-types';
import qs from 'query-string';
import React from 'react';
import { injectIntl, intlShape } from 'react-intl';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';
import { push } from 'react-router-redux';
import { compose } from 'redux';
import { createStructuredSelector } from 'reselect';
import { GROUP_ACCESS_CONTROL } from '../../../common/constants';
import ExitModal from '../../components/ExitModal';
import MainTab from '../../components/MainTab';
import AC from '../../utils/accessControl';
import injectSaga from '../../utils/injectSaga';
import {
  addAgent,
  addAgentFallbackResponse,
  addNewAgentParameter,
  addNewHeaderAgentWebhook,
  changeAgentData,
  changeAgentName,
  changeAgentParameterName,
  changeAgentParameterValue,
  changeAgentSettingsData,
  changeCategoryClassifierThreshold,
  changeHeaderNameAgentWebhook,
  changeHeaderValueAgentWebhook,
  changePostFormatData,
  changeWebhookData,
  changeWebhookPayloadType,
  clearSayingToAction,
  deleteAgent,
  deleteAgentFallbackResponse,
  deleteAgentParameter,
  deleteHeaderAgentWebhook,
  loadActions,
  loadAgent,
  loadSettings,
  loadUsers,
  resetAgentData,
  resetStatusFlag,
  resetSuccessAgent,
  setAgentDefaults,
  toggleChatButton,
  toggleConversationBar,
  trainAgent,
  updateAgent,
  testAgentTrain,
  addAgentVersion,
  loadAgentVersion,
  updateAgentVersion,
  deleteAgentVersion,
} from '../App/actions';
import {
  makeSelectActions,
  makeSelectAgent,
  makeSelectAgentPostFormat,
  makeSelectAgentSettings,
  makeSelectAgentTouched,
  makeSelectAgentWebhook,
  makeSelectCurrentUser,
  makeSelectLoading,
  makeSelectLoadingAgentVersion,
  makeSelectLocale,
  makeSelectServerStatus,
  makeSelectSettings,
  makeSelectSuccessAgent,
  makeSelectUsers,
  makeSelectAgentVersions,
} from '../App/selectors';

import Form from './Components/Form';
import messages from './messages';
import saga from './saga';

/* eslint-disable react/prefer-stateless-function */
export class AgentPage extends React.PureComponent {
  constructor(props) {
    super(props);
    this.submit = this.submit.bind(this);
    this.initForm = this.initForm.bind(this);
    this.navigateToNextLocation = this.navigateToNextLocation.bind(this);
    this.onAccessControlUserChange = this.onAccessControlUserChange.bind(this);
  }

  state = {
    ref: qs.parse(this.props.location.search, { ignoreQueryPrefix: true }).ref,
    nextLocation: null,
    openExitModal: false,
    isNewAgent: this.props.match.params.id === 'create',
    settingsLoaded: false,
    formError: false,
    exitAfterSubmit: false,
    errorState: {
      agentName: false,
      fallbackAction: false,
      welcomeAction: false,
      webhookKey: false,
      webhookUrl: false,
      rasaURLs: false,
      ducklingURL: false,
      ducklingDimension: false,
      categoryClassifierPipeline: false,
      sayingClassifierPipeline: false,
      keywordClassifierPipeline: false,
      spacyPretrainedEntities: false,
      postFormatPayload: false,
      webhookPayload: false,
      training: false,
      tabs: [],
    },
    selectedAccessControlUser: null,
  };

  initForm() {
    if (this.state.isNewAgent) {
      this.props.onResetData();
      if (!this.state.settingsLoaded) {
        this.props.onSetAgentDefaults();
        this.setState({
          settingsLoaded: true,
        });
      }
    } else {
      this.props.onResetData(this.state.ref);
      this.props.onLoadActions(this.props.match.params.id);
      this.props.onLoadAgent(this.props.match.params.id);
    }
  }

  componentWillMount() {
    if (this.props.settings.defaultAgentLanguage) {
      this.initForm();
    } else {
      this.props.onLoadSettings();
    }
    this.unblock = this.props.history.block(nextLocation => {
      if (this.props.touched && !this.props.success) {
        this.setState({
          openExitModal: true,
          nextLocation,
        });
        return false;
      }
      return true;
    });
    this.props.onShowChatButton(true);
    this.props.onLoadUsers();
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.settings.defaultAgentLanguage && this.props.settings.defaultAgentLanguage) {
      this.initForm();
    }
    if (this.props.success) {
      if (this.state.exitAfterSubmit) {
        this.navigateToNextLocation();
      } else {
        this.props.onResetSuccessAgent();
      }
      if (this.state.isNewAgent) {
        this.props.onToggleChat(true);
        this.props.onGoToUrl(`/agent/${this.props.agent.id}/dialogue`);
      }
    }
  }

  componentWillUnmount() {
    this.unblock();
  }

  navigateToNextLocation() {
    this.unblock();
    this.props.history.push(this.state.nextLocation.pathname);
  }

  onAccessControlUserChange({ user }) {
    this.setState({ selectedAccessControlUser: user });
  }

  submit(exit) {
    let errors = false;
    const newErrorState = {
      agentName: false,
      agentDescription: false,
      fallbackAction: false,
      webhookUrl: false,
      webhookKey: false,
      rasaURLs: false,
      ducklingURL: false,
      ducklingDimension: false,
      categoryClassifierPipeline: false,
      sayingClassifierPipeline: false,
      keywordClassifierPipeline: false,
      spacyPretrainedEntities: false,
      training: false,
      tabs: [],
    };
    if (!this.props.agent.agentName || this.props.agent.agentName === '') {
      errors = true;
      newErrorState.agentName = true;
      newErrorState.tabs.push(0);
    } else {
      newErrorState.agentName = false;
    }
    if (!this.props.agent.description || this.props.agent.description === '') {
      errors = true;
      newErrorState.agentDescription = true;
      newErrorState.tabs.push(0);
    } else {
      newErrorState.agentDescription = false;
    }
    if (!this.state.isNewAgent && !this.props.agent.fallbackAction) {
      errors = true;
      newErrorState.fallbackAction = true;
      newErrorState.tabs.push(0);
    } else {
      newErrorState.fallbackAction = false;
    }
    if (this.props.agent.useWebhook && (!this.props.webhook.webhookKey || this.props.webhook.webhookKey === '')) {
      errors = true;
      newErrorState.webhookKey = true;
      newErrorState.tabs.push(1);
    } else {
      newErrorState.webhookKey = false;
    }
    if (this.props.agent.useWebhook && (!this.props.webhook.webhookUrl || this.props.webhook.webhookUrl === '')) {
      errors = true;
      newErrorState.webhookUrl = true;
      newErrorState.tabs.push(1);
    } else {
      newErrorState.webhookUrl = false;
    }
    if (!this.props.agentSettings.rasaURLs
      || this.props.agentSettings.rasaURLs.length === 0
      || this.props.agentSettings.rasaURLs.indexOf('') !== -1
      || this.props.agentSettings.rasaURLs.some((item) => {
        return this.props.agentSettings.rasaURLs.indexOf(item)
          !== this.props.agentSettings.rasaURLs.lastIndexOf(item);
      })) {
      errors = true;
      newErrorState.rasaURLs = true;
      newErrorState.tabs.push(2);
    } else {
      newErrorState.rasaURLs = false;
    }
    if (!this.props.agentSettings.ducklingURL || this.props.agentSettings.ducklingURL === '') {
      errors = true;
      newErrorState.ducklingURL = true;
      newErrorState.tabs.push(1);
    } else {
      newErrorState.ducklingURL = false;
    }
    if (!this.props.agent.enableModelsPerCategory && this.props.agent.multiCategory) {
      errors = true;
      newErrorState.training = true;
      newErrorState.tabs.push(2);
    } else {
      newErrorState.training = false;
    }

    try {
      if (!Array.isArray(this.props.agentSettings.ducklingDimension)) {
        throw 'Duckling dimensions is not an array';
      }
      newErrorState.ducklingDimension = false;
    } catch (e) {
      errors = true;
      newErrorState.tabs.push(1);
      newErrorState.ducklingDimension = true;
    }

    try {
      if (!Array.isArray(this.props.agentSettings.categoryClassifierPipeline)) {
        throw 'Category classifier pipeline is not an array';
      }
      newErrorState.categoryClassifierPipeline = false;
    } catch (e) {
      errors = true;
      newErrorState.tabs.push(1);
      newErrorState.categoryClassifierPipeline = true;
    }

    try {
      if (!Array.isArray(this.props.agentSettings.sayingClassifierPipeline)) {
        throw 'Saying classifier pipeline is not an array';
      }
      newErrorState.sayingClassifierPipeline = false;
    } catch (e) {
      errors = true;
      newErrorState.tabs.push(1);
      newErrorState.sayingClassifierPipeline = true;
    }

    try {
      if (!Array.isArray(this.props.agentSettings.keywordClassifierPipeline)) {
        throw 'Keyword classifier pipeline is not an array';
      }
      newErrorState.keywordClassifierPipeline = false;
    } catch (e) {
      errors = true;
      newErrorState.tabs.push(1);
      newErrorState.keywordClassifierPipeline = true;
    }

    try {
      if (!Array.isArray(this.props.agentSettings.spacyPretrainedEntities)) {
        throw 'Spacy pretrained entities is not an array';
      }
      newErrorState.spacyPretrainedEntities = false;
    } catch (e) {
      errors = true;
      newErrorState.tabs.push(1);
      newErrorState.spacyPretrainedEntities = true;
    }

    try {
      if (this.props.agent.usePostFormat && this.props.postFormat.postFormatPayload === '') {
        throw 'Response payload is not an object';
      }
      newErrorState.postFormatPayload = false;
    } catch (e) {
      errors = true;
      newErrorState.tabs.push(1);
      newErrorState.postFormatPayload = true;
    }

    try {
      if (this.props.agent.useWebhook && this.props.webhook.webhookPayloadType !== 'None' && this.props.webhook.webhookPayload === '') {
        throw 'Webhook payload is not an object';
      }
      newErrorState.webhookPayload = false;
    } catch (e) {
      errors = true;
      newErrorState.tabs.push(1);
      newErrorState.webhookPayload = true;
    }

    if (!errors) {
      this.setState({
        formError: false,
        exitAfterSubmit: exit,
        errorState: { ...newErrorState },
      });
      if (this.state.isNewAgent) {
        this.props.onAddNewAgent();
      } else {
        this.props.onEditAgent();
      }
    } else {
      this.setState({
        formError: true,
        errorState: { ...newErrorState },
      });
    }
  }

  render() {
    const { intl, currentUser } = this.props;
    const isReadOnly = !AC.validate({ userPolicies: currentUser.simplifiedGroupPolicies, requiredPolicies: [GROUP_ACCESS_CONTROL.AGENT_WRITE] });
    return this.props.settings.defaultAgentLanguage ? (
      <Grid container>
        <ExitModal
          open={this.state.openExitModal}
          onExit={() => {
            this.navigateToNextLocation();
          }}
          onSaveAndExit={() => {
            this.submit(true);
          }}
          onClose={() => {
            this.setState({ openExitModal: false });
          }}
          type={intl.formatMessage(messages.instanceName)}
        />
        <MainTab
          isReadOnly={isReadOnly}
          disableSave={isReadOnly}
          locale={this.props.locale}
          touched={this.props.touched}
          loading={this.props.loading}
          loadingAgentVersion={this.props.loadingAgentVersion}
          success={this.props.success}
          onSaveAndExit={() => {
            this.submit(true);
          }}
          agentName={this.props.agent.agentName}
          currentAgent={this.props.agent}
          agentGravatar={this.props.agent.gravatar ? this.props.agent.gravatar : 1}
          agentUIColor={this.props.agent.uiColor}
          newAgent={this.state.isNewAgent}
          formError={this.state.formError}
          onFinishAction={() => {
            this.submit(false);
          }}
          onTrain={this.props.onTrain}
          agentStatus={this.props.agent.status}
          serverStatus={this.props.serverStatus}
          lastTraining={this.props.agent.lastTraining}
          enableTabs={!this.state.isNewAgent}
          selectedTab="agents"
          agentForm={
            <Form
              agentNameErrorState={this.state.errorState.agentName}
              errorState={this.state.errorState}
              agent={this.props.agent}
              webhook={this.props.webhook}
              postFormat={this.props.postFormat}
              settings={this.props.settings}
              agentSettings={this.props.agentSettings}
              onChangeAgentData={this.props.onChangeAgentData}
              onChangeAgentName={this.props.onChangeAgentName}
              onChangeWebhookData={this.props.onChangeWebhookData}
              onChangeWebhookPayloadType={this.props.onChangeWebhookPayloadType}
              onAddNewHeader={this.props.onAddNewHeader}
              onDeleteHeader={this.props.onDeleteHeader}
              onChangeHeaderName={this.props.onChangeHeaderName}
              onChangeHeaderValue={this.props.onChangeHeaderValue}
              onChangePostFormatData={this.props.onChangePostFormatData}
              onChangeAgentSettingsData={this.props.onChangeAgentSettingsData}
              onChangeCategoryClassifierThreshold={this.props.onChangeCategoryClassifierThreshold}
              onAddFallbackResponse={this.props.onAddFallbackResponse}
              onDeleteFallbackResponse={this.props.onDeleteFallbackResponse}
              onDelete={this.props.onDelete.bind(null, this.props.agent.id)}
              newAgent={this.state.isNewAgent}
              agentActions={this.props.agentActions}
              onGoToUrl={this.props.onGoToUrl}
              defaultFallbackActionName={
                this.props.settings.defaultFallbackActionName
              }
              defaultWelcomeActionName={
                this.props.settings.defaultWelcomeActionName
              }
              onAddNewParameter={this.props.onAddNewParameter}
              onDeleteParameter={this.props.onDeleteParameter}
              onChangeParameterName={this.props.onChangeParameterName}
              onChangeParameterValue={this.props.onChangeParameterValue}
              users={this.props.users}
              selectedAccessControlUser={this.state.selectedAccessControlUser}
              onAccessControlUserChange={this.onAccessControlUserChange}
              isReadOnly={isReadOnly}
            />
          }
          dialogueForm={Link}
          dialogueURL={`/agent/${this.props.agent.id}/dialogue`}
          reviewForm={Link}
          reviewURL={`/agent/${this.props.agent.id}/review`}
          analyticsForm={Link}
          analyticsURL={`/agent/${this.props.agent.id}/analytics`}
          onTestAgentTrain={this.props.onTestAgentTrain}
          agent={this.props.agent}
          onAddAgentVersion={this.props.onAddAgentVersion}
          onLoadAgentVersion={this.props.onLoadAgentVersion}
          onUpdateAgentVersion={this.props.onUpdateAgentVersion}
          onDeleteAgentVersion={this.props.onDeleteAgentVersion}
          agentVersions={this.props.agentVersions ? this.props.agentVersions : []}
        />
      </Grid>
    ) : (
        <CircularProgress
          style={{ position: 'absolute', top: '40%', left: '49%' }}
        />
      );
  }
}

AgentPage.propTypes = {
  intl: intlShape.isRequired,
  agent: PropTypes.object,
  serverStatus: PropTypes.string,
  webhook: PropTypes.object,
  postFormat: PropTypes.object,
  settings: PropTypes.object,
  agentSettings: PropTypes.object,
  onLoadAgent: PropTypes.func,
  onLoadActions: PropTypes.func,
  onChangeAgentData: PropTypes.func,
  onChangeAgentName: PropTypes.func,
  onChangeWebhookData: PropTypes.func,
  onChangeWebhookPayloadType: PropTypes.func,
  onAddNewHeader: PropTypes.func,
  onDeleteHeader: PropTypes.func,
  onChangeHeaderName: PropTypes.func,
  onChangeHeaderValue: PropTypes.func,
  onChangePostFormatData: PropTypes.func,
  onChangeCategoryClassifierThreshold: PropTypes.func,
  onChangeAgentSettingsData: PropTypes.func,
  onAddFallbackResponse: PropTypes.func,
  onDeleteFallbackResponse: PropTypes.func,
  onAddNewAgent: PropTypes.func,
  onEditAgent: PropTypes.func,
  onSuccess: PropTypes.func,
  onTrain: PropTypes.func,
  onGoToUrl: PropTypes.func,
  onDelete: PropTypes.func,
  agentActions: PropTypes.array,
  onAddNewParameter: PropTypes.func,
  onDeleteParameter: PropTypes.func,
  onChangeParameterName: PropTypes.func,
  onChangeParameterValue: PropTypes.func,
  onToggleChat: PropTypes.func,
  onShowChatButton: PropTypes.func,
  onResetSuccessAgent: PropTypes.func,
  onSetAgentDefaults: PropTypes.func,
  onResetData: PropTypes.func,
  onLoadUsers: PropTypes.func,
  users: PropTypes.array,
  currentUser: PropTypes.object,
};

const mapStateToProps = createStructuredSelector({
  agent: makeSelectAgent(),
  serverStatus: makeSelectServerStatus(),
  webhook: makeSelectAgentWebhook(),
  postFormat: makeSelectAgentPostFormat(),
  agentSettings: makeSelectAgentSettings(),
  settings: makeSelectSettings(),
  agentActions: makeSelectActions(),
  loading: makeSelectLoading(),
  loadingAgentVersion: makeSelectLoadingAgentVersion(),
  success: makeSelectSuccessAgent(),
  touched: makeSelectAgentTouched(),
  locale: makeSelectLocale(),
  users: makeSelectUsers(),
  currentUser: makeSelectCurrentUser(),
  agentVersions: makeSelectAgentVersions()
});

function mapDispatchToProps(dispatch) {
  return {
    onResetData: ref => {
      dispatch(resetAgentData(ref));
    },
    onLoadAgent: agentId => {
      dispatch(loadAgent(agentId));
    },
    onChangeAgentData: (field, value) => {
      dispatch(changeAgentData({ field, value }));
    },
    onChangeAgentName: (field, value) => {
      dispatch(changeAgentName({ field, value }));
    },
    onChangeWebhookData: (field, value) => {
      dispatch(changeWebhookData({ field, value }));
    },
    onChangeWebhookPayloadType: (field, value) => {
      dispatch(changeWebhookPayloadType({ field, value }));
    },
    onAddNewHeader: payload => {
      dispatch(addNewHeaderAgentWebhook(payload));
    },
    onDeleteHeader: headerIndex => {
      dispatch(deleteHeaderAgentWebhook(headerIndex));
    },
    onChangeHeaderName: (headerIndex, value) => {
      dispatch(changeHeaderNameAgentWebhook(headerIndex, value));
    },
    onChangeHeaderValue: (headerIndex, value) => {
      dispatch(changeHeaderValueAgentWebhook(headerIndex, value));
    },
    onChangePostFormatData: (field, value) => {
      dispatch(changePostFormatData({ field, value }));
    },
    onChangeAgentSettingsData: (field, value) => {
      dispatch(changeAgentSettingsData({ field, value }));
    },
    onChangeCategoryClassifierThreshold: value => {
      dispatch(changeCategoryClassifierThreshold(value));
    },
    onAddFallbackResponse: newFallback => {
      dispatch(addAgentFallbackResponse(newFallback));
    },
    onDeleteFallbackResponse: fallbackIndex => {
      dispatch(deleteAgentFallbackResponse(fallbackIndex));
    },
    onAddNewAgent: () => {
      dispatch(addAgent());
    },
    onSuccess: url => {
      dispatch(resetStatusFlag());
      dispatch(push(url));
    },
    onEditAgent: () => {
      dispatch(updateAgent());
    },
    onTrain: () => {
      dispatch(trainAgent());
    },
    onDelete: id => {
      dispatch(deleteAgent(id));
    },
    onLoadActions: agentId => {
      dispatch(loadActions(agentId));
    },
    onGoToUrl: url => {
      dispatch(clearSayingToAction());
      dispatch(push(`${url}?ref=agent`));
    },
    onAddNewParameter: payload => {
      dispatch(addNewAgentParameter(payload));
    },
    onDeleteParameter: parameterName => {
      dispatch(deleteAgentParameter(parameterName));
    },
    onChangeParameterName: (oldParameterName, newParameterName) => {
      dispatch(changeAgentParameterName(oldParameterName, newParameterName));
    },
    onChangeParameterValue: (parameterName, value) => {
      dispatch(changeAgentParameterValue(parameterName, value));
    },
    onLoadSettings: () => {
      dispatch(loadSettings());
    },
    onSetAgentDefaults: () => {
      dispatch(setAgentDefaults());
    },
    onToggleChat: value => {
      dispatch(toggleConversationBar(value));
    },
    onShowChatButton: value => {
      dispatch(toggleChatButton(value));
    },
    onResetSuccessAgent: () => {
      dispatch(resetSuccessAgent());
    },
    onLoadUsers: () => {
      dispatch(loadUsers());
    },
    onTestAgentTrain: (id) => {
      dispatch(testAgentTrain(id));
    },
    onLoadAgentVersion: (versionId, currentAgentId) => {
      dispatch(loadAgentVersion(versionId, currentAgentId));
    },
    onUpdateAgentVersion: (version) => {
      dispatch(updateAgentVersion(version));
    },
    onDeleteAgentVersion: (versionId, currentAgentId) => {
      dispatch(deleteAgentVersion(versionId, currentAgentId));
    },
    onAddAgentVersion: id => {
      dispatch(addAgentVersion(id));
    },
  };
}

const withConnect = connect(
  mapStateToProps,
  mapDispatchToProps,
);

const withSaga = injectSaga({ key: 'agent', saga });

export default injectIntl(
  compose(
    withSaga,
    withConnect,
  )(withRouter(AgentPage)),
);
