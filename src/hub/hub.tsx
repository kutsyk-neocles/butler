import "./hub.scss";

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

import { Tenants, EpicuroServices, IVersionTableItem, IEpicuroService, getUiUri } from "../data/tenants-service";
import { ObservableArray, ObservableValue } from "azure-devops-ui/Core/Observable";
import { IEpicuroVersion, VersionCard } from "../version-card/version-card"
import { DomainTest } from "../data/domains-service";

class Hub extends React.Component<{}, any> {

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
    
    let versionResults = [];
    for (let tenant of Tenants)
    {
      let tenantResult = {tenant: tenant.name, env: 'test', versions: new Array<IEpicuroVersion>()};
      for (let service of EpicuroServices)
      {
        let uri = getUiUri(tenant, 'test', DomainTest);
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

    console.log(versionResults);
    this.setState({
      versionResults: versionResults
    })
  }

  setUserCredentials(credentials: string) {
    this.setState({ userName: credentials });
  } 

  public render(): JSX.Element {
    const items = [];
    
    if (this.state.versionResults)
    {
      for (const [index, value] of this.state.versionResults.entries()) {
        items.push(<VersionCard key={index} tenantVersion={value}></VersionCard>)
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

        {items}

      </Page>
    );
  }

}

ReactDOM.render(<Hub />, document.getElementById("root"));
