import "./index.scss";

import * as React from "react";
import * as ReactDOM from "react-dom";
import * as SDK from "azure-devops-extension-sdk";
import { Dialog } from "azure-devops-ui/Dialog";
import {
  CustomHeader, HeaderDescription,
  HeaderIcon,
  HeaderTitle,
  HeaderTitleArea,
  HeaderTitleRow,
  TitleSize, Header
} from "azure-devops-ui/Header";
import { Image } from "azure-devops-ui/Image";
import { Page } from "azure-devops-ui/Page";
import { Panel } from "azure-devops-ui/Panel";
import { Card } from "azure-devops-ui/Card";
import { renderSimpleCell, Table } from "azure-devops-ui/Table";

import { Tenants, EpicuroServices, IVersionTableItem, IEpicuroService, getUiUri } from "../tenants-service";
import { Environments } from "../envs-service";
import { ObservableArray, ObservableValue } from "azure-devops-ui/Core/Observable";
import { IEpicuroVersion, VersionCard } from "../version-card/version-card"
import { DomainProd, DomainTest } from "../domains-service";
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import Box from "@material-ui/core/Box";
import Container from "@material-ui/core/Container";
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';

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

class Index extends React.Component<{}, any> {

  constructor(props: {}) {
    super(props);
    this.setUserCredentials = this.setUserCredentials.bind(this);

    this.state = {
    };
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
    const items = [];

    for (const [i, env] of Environments.entries()) {
      const versionItems = [];
      for (const [j, tenant] of Tenants.entries()) {
        versionItems.push(<VersionCard key={i + tenant.name + '-' + env + j} tenant={tenant} env={env}></VersionCard>)
      }
      items.push(
        <div className="flex-grow">
          <ThemeProvider theme={theme}>
            <AppBar position="static" key={env + i}>
              <Toolbar>
                <Typography variant="h6">
                  {env}
                </Typography>
              </Toolbar>
            </AppBar>
          </ThemeProvider>
          {versionItems}
        </div>
      );
    }


    return (
      <Container component="div">
        {items}
      </Container>

    );
  }

}

ReactDOM.render(<Index />, document.getElementById("root"));
