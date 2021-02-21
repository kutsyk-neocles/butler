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

import { Tenants, getURIsForTenant, IVersionTableItem } from "../data/tenants-service";
import { ObservableArray, ObservableValue } from "azure-devops-ui/Core/Observable";
import { VersionCard } from "../version-card/version-card"

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

        <VersionCard></VersionCard>

      </Page>
    );
  }

}

ReactDOM.render(<Hub />, document.getElementById("root"));
