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

export class VersionCard extends React.Component<any, any> {

  constructor(props: any) {
    super(props);

  }

  public async componentDidMount() {
  }

  private collapsed = new ObservableValue<boolean>(true);

  private onCollapseClicked = () => {
    this.collapsed.value = !this.collapsed.value;
  };

  public render(): JSX.Element {
    const tableItems = new ObservableArray<IEpicuroVersion>(this.props.tenantVersion.versions);

    return (
        <Card
          className="flex-grow bolt-table-card"
          collapsible={true}
          collapsed={this.collapsed}
          onCollapseClick={this.onCollapseClicked}
          titleProps={{ text: `${this.props.tenantVersion.tenant} - ${this.props.tenantVersion.env}` }}
        >
          <div className="flex-row" style={{ flexWrap: "wrap" }}>
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