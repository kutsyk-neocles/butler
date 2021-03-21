import "./index.scss";

import * as React from "react";
import * as ReactDOM from "react-dom";
import * as SDK from "azure-devops-extension-sdk";

import { getTenantForDeploymentName, Tenants } from "../tenants-service";
import { getEnvForDeploymentName, Environments, getClusterForDeploymentName } from "../envs-service";
import AppBar from '@material-ui/core/AppBar';
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';
import Grid from "@material-ui/core/Grid";
import { Button, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, Input, InputLabel, ListItemText, MenuItem, Paper, Select, Tab, Tabs, TextField, Toolbar, Typography } from "@material-ui/core";
import VersionCard from "../version-card/version-card";
import * as azdev from "azure-devops-node-api";
import { AzureDevOpsProjectId, OrgUrl } from "../azure-devops-values";
import * as ReleaseApi from 'azure-devops-node-api/ReleaseApi';
import * as ReleaseInterfaces from 'azure-devops-node-api/interfaces/ReleaseInterfaces';
import { getTenantsReleasesForDefinition } from "../azure-devops-service";
import CircularProgress from '@material-ui/core/CircularProgress';
import { Autocomplete } from "@material-ui/lab";
import TuneIcon from '@material-ui/icons/Tune';
import CheckBoxIcon from '@material-ui/icons/CheckBox';
import { TreeViewComponent } from "@syncfusion/ej2-react-navigations";
import { ProgressButtonComponent, SpinSettingsModel, AnimationSettingsModel } from '@syncfusion/ej2-react-splitbuttons';
import update from 'react-addons-update';
import * as _ from "lodash";

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

function a11yProps(index: any) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

function getReleasesFolderStructure(allReleases: any, releasesFolders: any) {
  for (let release of allReleases) {
    let relPath: string = release?.path?.substring(1) ?? "";
    let folderStructure = relPath.split('\\');
    let releaseFolder: any = releasesFolders;

    if (folderStructure.length > 1) {
      for (let j = 0; j < folderStructure.length; j++) {
        let folder = folderStructure[j];
        if (j != folderStructure.length - 1)
          releaseFolder = releaseFolder.find((f: any) => f.id == folder).children;
        else
          releaseFolder = releaseFolder.find((f: any) => f.id == folder);
      }
    }
    else {
      releaseFolder = releasesFolders.find((f: any) => f.id == folderStructure[0]);
    }

    if (releaseFolder) {
      if (!releaseFolder['releases'])
        releaseFolder['releases'] = [];

      releaseFolder['releases'].push(release.name);
    }
    else {
      console.log(`relPath: ${relPath}`);
    }
  }
}

function getReleasesChooserStructure(index: number, parentId: any, releaseFolder: any) {
  let result: Array<any> = [];
  let thisFolder: any = {
    id: index++,
    name: releaseFolder.id,
    hasChild: releaseFolder.children.length > 0 || releaseFolder.releases.length > 0
  };
  if (parentId != null) {
    thisFolder['pid'] = parentId;
  }

  if (thisFolder.name.length > 0)
    result.push(thisFolder);

  let childParentId = null;
  if (thisFolder.name.length > 0) {
    childParentId = thisFolder.id;
  }

  for (let rel of releaseFolder.releases) {
    let relObj: any = { id: index++, name: rel };
    if (childParentId != null)
      relObj['pid'] = childParentId;
    result.push(relObj);
  }

  if (thisFolder.hasChild) {
    for (let relChild of releaseFolder.children) {
      let childRes = getReleasesChooserStructure(index, childParentId, relChild);
      result = result.concat(childRes);
      index += childRes.length;
    }
  }

  return result;
}

function genTree(row: any): any {
  const [parent, ...children] = row.split('\\');

  if (!children || children.length === 0) {
    return [{
      id: parent,
      children: []
    }];
  }

  return [{
    id: parent,
    children: genTree(children.join('\\'))
  }];
};

function mergeDeep(children: any) {
  const res = children.reduce((result: any, curr: any) => {
    const entry = curr;
    const existing = result.find((e: any) => e.id === entry.id);

    if (existing) {
      existing.children = [].concat(existing.children, entry.children);
    } else {
      result.push(entry);
    }

    return result;
  }, []);

  for (let i = 0; i < res.length; i++) {
    const entry = res[i];
    if (entry.children && entry.children.length > 0) {
      entry.children = mergeDeep(entry.children);
    }
  };

  return res;
}

class Index extends React.Component<{}, any> {
  checkedNodes: any;
  showCheckBox: boolean = true;
  treeRef: any;

  constructor(props: {}) {
    super(props);
    this.handleOpenReleasesDialog = this.handleOpenReleasesDialog.bind(this);
    this.handleCloseReleaseDialog = this.handleCloseReleaseDialog.bind(this);
    this.handleReleaseNodeCheck = this.handleReleaseNodeCheck.bind(this);
    this.renderReleaseChooserDialog = this.renderReleaseChooserDialog.bind(this);

    this.state = {
      value: 0,
      loading: true,
      saving: false,
      chosenReleases: [],
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
    if (this.state.releaseApiObject) {
      this.setState({
        saving: true
      });

      let processedDeployments = {};
      let deployments = {};

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
  };

  handleReleaseNodeCheck(args: any) {
    let releases: Array<any> = [];
    if (this.state.releasesForChooser.dataSource) {
      let relesesFromChooser = this.state.releasesForChooser.dataSource;
      
      for (let i of this.treeRef.checkedNodes) {
        releases.push(relesesFromChooser[i]);
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
    const allReleases: ReleaseInterfaces.ReleaseDefinition[] = await releaseApiObject.getReleaseDefinitions(AzureDevOpsProjectId);

    this.setState({ releaseApiObject: releaseApiObject, token: accessToken });

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
      <Dialog onClose={this.handleCloseReleaseDialog} aria-labelledby="customized-dialog-title" open={this.state.open}>
        <DialogTitle id="customized-dialog-title">
          Choose releases
      </DialogTitle>
        <DialogContent dividers style={{ width: '480px' }}>
          {dialogBody}
        </DialogContent>
        <DialogActions>
          <Button autoFocus color="primary" onClick={this.handleCloseReleaseDialog}>Save</Button>
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
        <div style={{ width: "100%" }}>
          <Paper variant="outlined">
            <Grid container spacing={1}>
              <Grid item xs={12} sm={6} md={6}>
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
