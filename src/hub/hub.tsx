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

import { Tenants, getURIsForTenant, IVersionTableItem } from "./TenantData";
import { ObservableArray, ObservableValue } from "azure-devops-ui/Core/Observable";

interface IHubState {
  dialogShown: boolean;
  panelShown: boolean;
  userName: string;
}

function onSize(event: MouseEvent, index: number, width: number) {
  (columns[index].width as ObservableValue<number>).value = width;
}

const columns = [
  {
    id: "serviceName",
    name: "Service Name",
    onSize: onSize,
    readonly: true,
    renderCell: renderSimpleCell,
    sortProps: {
      ariaLabelAscending: "Sorted A to Z",
      ariaLabelDescending: "Sorted Z to A",
    },
    width: new ObservableValue(-30),
  },
  {
    id: "branch",
    maxWidth: 300,
    name: "Branch",
    onSize: onSize,
    readonly: true,
    renderCell: renderSimpleCell,
    sortProps: {
      ariaLabelAscending: "Sorted low to high",
      ariaLabelDescending: "Sorted high to low",
    },
    width: new ObservableValue(-30),
  },
  {
    id: "build",
    name: "Build",
    width: new ObservableValue(-40),
    readonly: true,
    renderCell: renderSimpleCell,
  },
  {
    id: "commit",
    name: "Commit",
    width: new ObservableValue(-40),
    readonly: true,
    renderCell: renderSimpleCell,
  }
];

class Hub extends React.Component<{}, any> {

  constructor(props: {}) {
    super(props);
    this.setUserCredentials = this.setUserCredentials.bind(this);

    this.state = {
      dialogShown: false,
      panelShown: false,
      userName: '',
      versions: []
    };
  }

  public async componentDidMount() {
    await SDK.init();
    const userName = `${SDK.getUser().displayName}`;
    this.setUserCredentials(userName);

    const uris = getURIsForTenant('esprit');
    const allVersions = await Promise.all(uris.map(async (uri) => {
      let res = await (await fetch(`https://${uri}`)).json();
      res['serviceName'] = uri;
      return res;
    }
    ));
    this.setState({ versions: allVersions });
  }

  setUserCredentials(credentials: string) {
    this.setState({ userName: credentials });
  }

  public render(): JSX.Element {
    const tableItems = new ObservableArray<IVersionTableItem>(this.state.versions);

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

        <Card className="flex-grow bolt-table-card" contentProps={{ contentPadding: false }}>
          <Table<IVersionTableItem>
            ariaLabel="Table with sorting"
            className="table-example"
            columns={columns}
            containerClassName="h-scroll-auto"
            itemProvider={tableItems}
            role="table"
          />
        </Card>

      </Page>
    );
  }

  private openDialog(): void {
    this.setState({ dialogShown: true });
  }

  private closeDialog(): void {
    this.setState({ dialogShown: false });
  }

  private openPanel(): void {
    this.setState({ panelShown: true });
  }

  private closePanel(): void {
    this.setState({ panelShown: false });
  }
}

ReactDOM.render(<Hub />, document.getElementById("root"));
