import "./index.scss";

import * as React from "react";
import * as ReactDOM from "react-dom";
import * as SDK from "azure-devops-extension-sdk";

import { Tenants } from "../tenants-service";
import { Environments } from "../envs-service";
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import Box from "@material-ui/core/Box";
import Container from "@material-ui/core/Container";
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';
import Grid from "@material-ui/core/Grid";
import { Tab, Tabs } from "@material-ui/core";
import VersionCard from "../version-card/version-card";

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
        <Box>
          {children}
        </Box>
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
    this.setUserCredentials = this.setUserCredentials.bind(this);
    this.handleChange = this.handleChange.bind(this);

    this.state = {
      value: 0
    };
  }

  handleChange(event: any, value: any) {
    this.setState({
      value: value
    });
  }

  public async componentDidMount() {
    await SDK.init();
    const userName = `${SDK.getUser().displayName}`;
    this.setUserCredentials(userName);

  }

  setUserCredentials(credentials: string) {
    this.setState({ userName: credentials });
  }

  public render(): JSX.Element {
    const tabs = [];
    const tabsPanels = [];
    for (const [i, env] of Environments.entries()) {
      const versionItems = [];
      tabs.push(<Tab label={`${env}`} {...a11yProps(i)} />)

      for (const [j, tenant] of Tenants.entries()) {
        versionItems.push(<VersionCard key={i + tenant.name + '-' + env + j} tenant={tenant} env={env}></VersionCard>)
      }

      tabsPanels.push(
        <TabPanel value={this.state.value} index={i}>
          {versionItems}
        </TabPanel>
      );
    }

    return (
      <Grid
        container
        direction="column">
        <AppBar position="static">
          <Tabs value={this.state.value} onChange={this.handleChange} aria-label="envs tab">
            {tabs}
          </Tabs>
        </AppBar>
        {tabsPanels}
      </Grid>
    );
  }

}

ReactDOM.render(<Index />, document.getElementById("root"));
