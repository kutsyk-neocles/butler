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
import { ObservableArray, ObservableValue } from "azure-devops-ui/Core/Observable";
import { IEpicuroVersion, VersionCard } from "../version-card/version-card"
import { DomainProd, DomainTest } from "../domains-service";

async function getVersionsForEnv(env: string, domain: string) {
  let versionResults = [];
  for (let tenant of Tenants) {
    let tenantResult = { tenant: tenant.name, env: env, versions: new Array<IEpicuroVersion>() };
    for (let service of EpicuroServices) {
      let uri = getUiUri(tenant, env, domain);
      let versionForService = await (await fetch(`https://${uri}${service.path}/version.json`)).json();

      tenantResult.versions.push({
        serviceName: service.name,
        branch: versionForService.branch,
        build: versionForService.build,
        commit: versionForService.commit
      });
    }
    versionResults.push(tenantResult);
  }
  return versionResults;
}

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

    let testVersionResults = await getVersionsForEnv('test', DomainTest);
    let accVersionResults = await getVersionsForEnv('acc', DomainTest);


    this.setState({
      testVersionResults: testVersionResults,
      accVersionResults: accVersionResults
    })
  }

  setUserCredentials(credentials: string) {
    this.setState({ userName: credentials });
  }

  public render(): JSX.Element {
    const testItems = [];
    const accItems = [];

    if (this.state.testVersionResults) {
      for (const [index, value] of this.state.testVersionResults.entries()) {
        testItems.push(<VersionCard key={index} tenantVersion={value}></VersionCard>)
      }
    }

    if (this.state.accVersionResults) {
      for (const [index, value] of this.state.accVersionResults.entries()) {
        accItems.push(<VersionCard key={index} tenantVersion={value}></VersionCard>)
      }
    }

    return (
      <Page className="flex-grow">
        <CustomHeader className="bolt-header-with-commandbar">
          <HeaderTitleArea>
            <HeaderTitleRow>
              <HeaderTitle className="text-ellipsis" titleSize={TitleSize.Large}>
                BUTLER
              </HeaderTitle>
            </HeaderTitleRow>
            <HeaderDescription>
              Multi tenant managment extension
            </HeaderDescription>
          </HeaderTitleArea>
        </CustomHeader>
        <div className="flex-column">
          <Header title={"Test"} titleSize={TitleSize.Medium} titleIconProps={{ iconName: "ServerEnviroment" }} />
          {testItems}
          <Header title={"ACC"} titleSize={TitleSize.Medium} titleIconProps={{ iconName: "ServerEnviroment" }} />
          {accItems}
        </div>
      </Page>
    );
  }

}

ReactDOM.render(<Index />, document.getElementById("root"));
