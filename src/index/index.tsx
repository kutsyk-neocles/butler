import "./index.scss";

import * as React from "react";
import * as ReactDOM from "react-dom";
import * as SDK from "azure-devops-extension-sdk";

import { getTenantForDeploymentName, Tenants } from "../tenants-service";
import { getEnvForDeploymentName, Environments, getClusterForDeploymentName } from "../envs-service";
import AppBar from '@material-ui/core/AppBar';
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';
import Grid from "@material-ui/core/Grid";
import { Checkbox, Chip, FormControl, Input, InputLabel, ListItemText, MenuItem, Paper, Select, Tab, Tabs, TextField, Toolbar, Typography } from "@material-ui/core";
import VersionCard from "../version-card/version-card";

import * as azdev from "azure-devops-node-api";
import { AzureDevOpsProjectId, OrgUrl } from "../azure-devops-values";
import * as ReleaseApi from 'azure-devops-node-api/ReleaseApi';
import * as ReleaseInterfaces from 'azure-devops-node-api/interfaces/ReleaseInterfaces';
import * as BuildApi from "azure-devops-node-api/BuildApi";
import * as BuildInterface from "azure-devops-node-api/interfaces/BuildInterfaces";
import { getTenantsReleasesForDefinition } from "../azure-devops-service";
import CircularProgress from '@material-ui/core/CircularProgress';
import { Autocomplete } from "@material-ui/lab";

const theme = createMuiTheme({
  palette: {
    primary: {
      main: '#3d5afe'
    },
    secondary: {
      main: '#1de9b6'
    },
  },
});

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

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

class Index extends React.Component<{}, any> {

  constructor(props: {}) {
    super(props);
    this.setToken = this.setToken.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleTabChange = this.handleTabChange.bind(this);

    this.state = {
      value: 0,
      loading: true,
      chosenReleases: [],
      releasesNames: []
    };
  }

  handleChange = async (event: any, value: any) => {
    console.log(value);
    let releaseNames = value;
    this.setState({
      chosenReleases: releaseNames
    });


    if (this.state.releaseApiObject) {
      let deployments = [];
      for (let r of releaseNames) {
        console.log(r);
        //     const releaseAzure: ReleaseInterfaces.ReleaseDefinition[] = await this.state.releaseApiObject.getReleaseDefinitions(AzureDevOpsProjectId, r);
        //     console.log(releaseAzure);
        //     //     const deployment: any = await getTenantsReleasesForDefinition(releaseAzure, this.state.releaseApiObject);
        //     //     deployments.push(deployment);
      }
      //   //   this.setState({
      //   //     deployments: deployments
      //   //   });
    }
  };

  handleChangeMultiple = (event: any) => {
    const { options } = event.target;
    const value = [];
    for (let i = 0, l = options.length; i < l; i += 1) {
      if (options[i].selected) {
        value.push(options[i].value);
      }
    }

    this.setState({
      chosenReleases: value
    });
  };


  handleTabChange(event: any, value: any) {
    this.setState({
      value: value
    });
  }

  public async componentDidMount() {
    await SDK.init();
    const accessToken = await SDK.getAccessToken();
    this.setToken(accessToken);

    let authHandler = azdev.getHandlerFromToken(accessToken);
    let webApi = new azdev.WebApi(OrgUrl, authHandler);
    const releaseApiObject: ReleaseApi.IReleaseApi = await webApi.getReleaseApi();

    this.setState({
      releaseApiObject: releaseApiObject
    });

    const allReleases: ReleaseInterfaces.ReleaseDefinition[] = await releaseApiObject.getReleaseDefinitions(AzureDevOpsProjectId);
    let releasesNames = [];
    for (let release of allReleases) {
      releasesNames.push(release.name);
    }

    this.setState({
      releasesNames: releasesNames,
      loading: false
    });
  }

  setToken(credentials: string) {
    this.setState({ token: credentials });
  }

  public render(): JSX.Element {
    if (!this.state.loading) {
      const tabs = [];
      const tabsPanels = [];
      for (const [i, env] of Environments.entries()) {
        const versionItems = [];
        tabs.push(<Tab key={i + 'tab'} label={`${env}`} {...a11yProps(i)} />)

        for (const [j, tenant] of Tenants.entries()) {
          let tenantEnvDeployments = null;
          if (this.state.deployments) {
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
              <Grid item xs={12} sm={6} md={4}>
                <Autocomplete
                  multiple
                  id="tags-outlined"
                  options={this.state.releasesNames}
                  onChange={this.handleChange}
                  filterSelectedOptions
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      variant="outlined"
                      label="Releases"
                      placeholder="Please choose"
                    />
                  )}
                />
              </Grid>
            </Grid>
          </Paper>
          <AppBar position="static">
            <Tabs value={this.state.value} onChange={this.handleTabChange}
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
