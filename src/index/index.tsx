import "./index.scss";

import * as React from "react";
import * as ReactDOM from "react-dom";
import * as SDK from "azure-devops-extension-sdk";

import { Tenants } from "../tenants-service";
import { Environments } from "../envs-service";
import Grid from "@material-ui/core/Grid";
import { AppBar, Button, Dialog, DialogActions, DialogContent, DialogTitle, Paper, Tab, Tabs, Typography } from "@material-ui/core";
import VersionCard from "../version-card/version-card";
import * as azdev from "azure-devops-node-api";
import { AzureDevOpsProjectId, OrgUrl } from "../azure-devops-values";
import * as ReleaseApi from 'azure-devops-node-api/ReleaseApi';
import * as ReleaseInterfaces from 'azure-devops-node-api/interfaces/ReleaseInterfaces';
import { getTenantsReleasesForDefinition } from "../azure-devops-service";
import CircularProgress from '@material-ui/core/CircularProgress';
import TuneIcon from '@material-ui/icons/Tune';
import { TreeViewComponent } from "@syncfusion/ej2-react-navigations";
import * as _ from "lodash";
import { a11yProps, genTree, getReleasesChooserStructure, mergeDeep, PredefindReleases, getReleasesFolderStructure } from "../index-services/index-services";

function TabPanel(props: any) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <div>
          {children}
        </div>
      )}
    </div>
  );
}



class Index extends React.Component<{}, any> {
  checkedNodes: any;
  showCheckBox: boolean = true;
  treeRef: any;

  constructor(props: {}) {
    super(props);
    this.handleOpenReleasesDialog = this.handleOpenReleasesDialog.bind(this);
    this.handleSaveReleaseDialog = this.handleSaveReleaseDialog.bind(this);
    this.handleReleaseNodeCheck = this.handleReleaseNodeCheck.bind(this);
    this.renderReleaseChooserDialog = this.renderReleaseChooserDialog.bind(this);
    this.refreshReleases = this.refreshReleases.bind(this);
    this.getReleasesAndFolders = this.getReleasesAndFolders.bind(this);

    this.state = {
      value: 0,
      loading: true,
      saving: false,
      chosenReleases: PredefindReleases,
      open: false,
      releasesForChooser: {}
    };
  }

  handleOpenReleasesDialog = () => {
    this.setState({
      open: true
    });
  };

  handleCloseReleaseDialog = async () => {
    this.setState({
      open: false
    });
  }

  handleSaveReleaseDialog = async () => {
    if (this.state.releaseApiObject && this.treeRef) {
      this.setState({
        saving: true
      });

      if (this.state.releasesForChooser.dataSource) {
        let relesesFromChooser = this.state.releasesForChooser.dataSource;
        for (let i of this.treeRef.checkedNodes) {
          relesesFromChooser[i].isChecked = true;
        }

        this.setState({
          releasesForChooser: {
            datasource: relesesFromChooser,
            ...this.state.releasesForChooser
          }
        });
      }

      await this.refreshReleases();
    }
  };

  async refreshReleases() {
    if (this.state.releaseApiObject) {
      let processedDeployments = {};
      let deployments = {};

      for (let r of this.state.chosenReleases) {
        const releaseAzure: ReleaseInterfaces.ReleaseDefinition[] = await this.state.releaseApiObject.getReleaseDefinitions(AzureDevOpsProjectId, r.name);
        const deployment: any = await getTenantsReleasesForDefinition(releaseAzure, this.state.releaseApiObject);
        deployments = _.merge(processedDeployments, deployment);
      }

      this.setState({
        deployments: deployments,
        open: false,
        saving: false
      });
    }
  }

  async getReleasesAndFolders() {
    const allReleases: ReleaseInterfaces.ReleaseDefinition[] = await this.state.releaseApiObject.getReleaseDefinitions(AzureDevOpsProjectId);
    const paths: Array<string> = allReleases.map(r => r?.path?.substring(1) ?? "");
    const releasesFolders = mergeDeep(paths.map(genTree).map(([e]) => e));
    getReleasesFolderStructure(allReleases, releasesFolders);

    let chooserIndex = 0;
    let releaseChooser: any = [];
    for (let f of releasesFolders) {
      let structure = getReleasesChooserStructure(chooserIndex, null, f);
      chooserIndex += structure.length;
      releaseChooser = releaseChooser.concat(structure);
    }

    this.setState({
      releasesForChooser: { dataSource: releaseChooser, id: 'id', parentID: 'pid', text: 'name', hasChildren: 'hasChild' },
      loading: false
    });
  }

  handleReleaseNodeCheck(args: any) {
    let releases: Array<any> = [];
    if (this.state.releasesForChooser.dataSource) {
      let relesesFromChooser = this.state.releasesForChooser.dataSource;

      for (let i of this.treeRef.checkedNodes) {
        releases.push(relesesFromChooser[i]);
        console.log(relesesFromChooser[i].name);
      }

      this.setState({
        chosenReleases: releases
      });
    }
  }

  public async componentDidMount() {
    await SDK.init();
    const accessToken = await SDK.getAccessToken();
    const authHandler = azdev.getHandlerFromToken(accessToken);
    const webApi = new azdev.WebApi(OrgUrl, authHandler);
    const releaseApiObject: ReleaseApi.IReleaseApi = await webApi.getReleaseApi();

    this.setState({ releaseApiObject: releaseApiObject, token: accessToken });

    this.refreshReleases();
    this.getReleasesAndFolders();
  }

  renderReleaseChooserDialog() {
    let dialogBody = (this.state.saving)
      ? (
        <Grid
          container
          alignItems="center"
          direction="column">
          <CircularProgress />
          <Typography>Saving...</Typography>
        </Grid>
      )
      : (<TreeViewComponent
        ref={treeRef => this.treeRef = treeRef as TreeViewComponent}
        fields={this.state.releasesForChooser}
        showCheckBox={this.showCheckBox}
        nodeChecked={this.handleReleaseNodeCheck}
        checkedNodes={this.checkedNodes} />);

    return (
      <Dialog onClose={this.handleSaveReleaseDialog} aria-labelledby="customized-dialog-title" open={this.state.open}>
        <DialogTitle id="customized-dialog-title">
          Choose releases
      </DialogTitle>
        <DialogContent dividers style={{ width: '480px' }}>
          {dialogBody}
        </DialogContent>
        <DialogActions>
          <Button autoFocus color="primary" onClick={this.handleCloseReleaseDialog}>Close</Button>
          <Button autoFocus color="primary" onClick={this.handleSaveReleaseDialog}>Save</Button>
        </DialogActions>
      </Dialog >);
  }

  public render(): JSX.Element {
    if (!this.state.loading) {
      const tabs: Array<any> = [];
      const tabsPanels: Array<any> = [];
      for (const [i, env] of Environments.entries()) {
        const versionItems: Array<any> = [];
        tabs.push(<Tab key={i + 'tab'} label={`${env}`} {...a11yProps(i)} />)

        for (const [j, tenant] of Tenants.entries()) {
          let tenantEnvDeployments = null;
          if (this.state.deployments && this.state.deployments[tenant.name] && this.state.deployments[tenant.name]) {
            tenantEnvDeployments = this.state.deployments[tenant.name][env];
          }
          versionItems.push(<VersionCard key={i + tenant.name + '-' + env + j} tenant={tenant} env={env} deployments={tenantEnvDeployments} token={this.state.token}></VersionCard>)
        }

        tabsPanels.push(
          <TabPanel value={this.state.value} index={i} key={i}>
            {versionItems}
          </TabPanel>
        );
      }

      return (
        <div style={{ width: "100%", flexGrow: 1 }}>
          <Paper>
            <Grid container spacing={1}>
              <Grid item xs={8} sm={10} md={10}>
              </Grid>
              <Grid item xs={4} sm={2} md={2}>
                <div style={{ width: '100%' }} />
                <div style={{ flexGrow: 1 }} />
                <Button size="small" color="primary"
                  onClick={this.handleOpenReleasesDialog}
                  startIcon={<TuneIcon />}>
                  Releases
                </Button>
                {this.renderReleaseChooserDialog()}
              </Grid>
            </Grid>
          </Paper>
          <AppBar position="static">
            <Tabs value={this.state.value} onChange={(event: any, value: any) => this.setState({ value })}
              variant="scrollable"
              scrollButtons="auto"
              aria-label="envs tab">
              {tabs}
            </Tabs>
          </AppBar>
          {tabsPanels}
        </div>
      );
    }

    return (
      <Grid
        container
        alignItems="center"
        direction="column">
        <CircularProgress />
        <Typography>Preloading tenants and environments...</Typography>
      </Grid>
    );
  }
}

ReactDOM.render(<Index />, document.getElementById("root"));
