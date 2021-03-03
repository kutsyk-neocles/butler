import * as React from "react";
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
import { renderSimpleCell, Table, TableColumnLayout } from "azure-devops-ui/Table";

import { ObservableArray, ObservableValue } from "azure-devops-ui/Core/Observable";
import { IHeaderCommandBarItem } from "azure-devops-ui/HeaderCommandBar";
import { EpicuroServices, getUiUri, ITenant } from "../tenants-service";
import { DomainProd, DomainTest } from "../domains-service";

export interface IEpicuroVersion {
  serviceName: string;
  branch: string;
  build: string;
  commit: string;
}

const fixedVersionColumns = [
  {
    columnLayout: TableColumnLayout.singleLinePrefix,
    id: "serviceName",
    name: "Service Name",
    readonly: true,
    renderCell: renderSimpleCell,
    width: new ObservableValue(-30),
  },
  {
    id: "branch",
    name: "Branch",
    readonly: true,
    renderCell: renderSimpleCell,
    width: new ObservableValue(-30),
  },
  {
    columnLayout: TableColumnLayout.none,
    id: "build",
    name: "Build",
    readonly: true,
    renderCell: renderSimpleCell,
    width: new ObservableValue(-40),
  },
];


// const commandBarItems: IHeaderCommandBarItem[] = [
//   {
//     important: true,
//     id: "update",
//     text: "Update",
//     onActivate: () => {
//       console.log('Hello world');
//     },
//     iconProps: {
//       iconName: "Refresh"
//     }
//   }
// ];

async function getVersionsForEnv(tenant: ITenant, env: string, domain: string) {
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
  return tenantResult;
}

export class VersionCard extends React.Component<any, any> {

  constructor(props: any) {
    super(props);
    this.handleUpdate = this.handleUpdate.bind(this);

    this.state = {
      tenantVersions: {}
    };
  }

  commandBarItems: IHeaderCommandBarItem[] = [
    {
      important: true,
      id: "update",
      text: "Update",
      onActivate: () => {
        this.handleUpdate();
      },
      iconProps: {
        iconName: "Refresh"
      }
    }
  ]

  async handleUpdate() {
    let tenantVersions = await getVersionsForEnv(this.props.tenant, this.props.env, this.props.env == 'test' || this.props.env == 'acc'  ? DomainTest : DomainProd);

    this.setState({
      tenantVersions: tenantVersions
    });
  }

  public async componentDidMount() {
    let tenantVersions = await getVersionsForEnv(this.props.tenant, this.props.env, this.props.env == 'test' || this.props.env == 'acc'  ? DomainTest : DomainProd);

    this.setState({
      tenantVersions: tenantVersions
    });
  }

  private collapsed = new ObservableValue<boolean>(true);

  private onCollapseClicked = () => {
    this.collapsed.value = !this.collapsed.value;
  };

  public render(): JSX.Element {
    const tableItems = new ObservableArray<IEpicuroVersion>(this.state.tenantVersions.versions);

    return (
      <Card
        className="flex-grow bolt-table-card"
        collapsible={true}
        collapsed={this.collapsed}
        onCollapseClick={this.onCollapseClicked}
        headerCommandBarItems={this.commandBarItems}
        titleProps={{ text: `${this.props.tenant.name} - ${this.props.env}` }}
      >
        <div className="flex-row" style={{ flexWrap: "wrap" }}>
          <h2>{this.state.test}</h2>
          <Table<Partial<any>>
              ariaLabel="Table with sorting"
              className=""
              columns={fixedVersionColumns}
              containerClassName="h-scroll-auto"
              itemProvider={tableItems}
              role="table"
            />
        </div>
      </Card>
    );
  }

}