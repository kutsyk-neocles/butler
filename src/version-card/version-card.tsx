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
import { renderSimpleCell, Table } from "azure-devops-ui/Table";

import { ObservableArray, ObservableValue } from "azure-devops-ui/Core/Observable";

export interface IEpicuroVersion {
  serviceName: string;
  branch: string;
  build: string;
  commit: string;
}

export class VersionCard extends React.Component<any, any> {

  constructor(props: any) {
    super(props);

  }

  public async componentDidMount() {
  }

  private collapsed = new ObservableValue<boolean>(false);

  private onCollapseClicked = () => {
    this.collapsed.value = !this.collapsed.value;
  };

  public render(): JSX.Element {
    // const tableItems = new ObservableArray<IVersionTableItem>(this.state.versions);

    return (
        <Card
          className="flex-grow bolt-table-card"
          collapsible={true}
          collapsed={this.collapsed}
          onCollapseClick={this.onCollapseClicked}
          titleProps={{ text: `${this.props.tenantVersion.tenant} - ${this.props.tenantVersion.env}` }}
        >
          <div className="flex-row" style={{ flexWrap: "wrap" }}>
            <h1>Hello World</h1>
            {/* <Table<IVersionTableItem>
              ariaLabel="Table with sorting"
              className="table-example"
              columns={columns}
              containerClassName="h-scroll-auto"
              itemProvider={tableItems}
              role="table"
            /> */}
          </div>
        </Card>
    );
  }

}