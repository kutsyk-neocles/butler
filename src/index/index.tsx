import "./index.scss";

import * as React from "react";
import * as ReactDOM from "react-dom";
import * as SDK from "azure-devops-extension-sdk";

import { getTenantForDeploymentName, Tenants } from "../tenants-service";
import { getEnvForDeploymentName, Environments, getClusterForDeploymentName } from "../envs-service";
import AppBar from '@material-ui/core/AppBar';
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';
import Grid from "@material-ui/core/Grid";
import { Tab, Tabs, Typography } from "@material-ui/core";
import VersionCard from "../version-card/version-card";

import * as azdev from "azure-devops-node-api";
import { AzureDevOpsProjectId, OrgUrl } from "../azure-devops-values";
import * as ReleaseApi from 'azure-devops-node-api/ReleaseApi';
import * as ReleaseInterfaces from 'azure-devops-node-api/interfaces/ReleaseInterfaces';
import * as BuildApi from "azure-devops-node-api/BuildApi";
import * as BuildInterface from "azure-devops-node-api/interfaces/BuildInterfaces";
import { getTenantsReleasesForDefinition } from "../azure-devops-service";
import CircularProgress from '@material-ui/core/CircularProgress';


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

class Index extends React.Component<{}, any> {

  constructor(props: {}) {
    super(props);
    this.setToken = this.setToken.bind(this);
    this.handleChange = this.handleChange.bind(this);

    this.state = {
      value: 0,
      loading: true
    };
  }

  handleChange(event: any, value: any) {
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
    const releasesAZ: ReleaseInterfaces.ReleaseDefinition[] = await releaseApiObject.getReleaseDefinitions(AzureDevOpsProjectId, "-CD");

    const deployments: any = await getTenantsReleasesForDefinition(releasesAZ, releaseApiObject);
    
    this.setState({
      loading: false
    });

    this.setState({
      deployments: deployments
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
        <Grid
          container
          direction="column">
          <AppBar position="static">
            <Tabs value={this.state.value} onChange={this.handleChange}
              variant="scrollable"
              scrollButtons="auto"
              aria-label="envs tab">
              {tabs}
            </Tabs>
          </AppBar>
          {tabsPanels}
        </Grid>
      );
    }

    return (
      <Grid
        container
        alignItems="center"
        direction="column">
        <CircularProgress />
        <Typography>Preloading releases...</Typography>
      </Grid>
    );
  }
}

ReactDOM.render(<Index />, document.getElementById("root"));
