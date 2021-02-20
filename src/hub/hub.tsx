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
import { Table } from "azure-devops-ui/Table";
import { ZeroData, ZeroDataActionType } from "azure-devops-ui/ZeroData";

import { fixedColumns, tableItemsNoIcons } from "./TableData";

interface IHubState {
  dialogShown: boolean;
  panelShown: boolean;
  userName: string;
}

class Hub extends React.Component<{}, IHubState> {

  constructor(props: {}) {
    super(props);
    this.setUserCredentials = this.setUserCredentials.bind(this);

    this.state = {
      dialogShown: false,
      panelShown: false,
      userName: ''
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
        <ZeroData
          imagePath="../../../static/img/world.png"
          imageAltText="World image"
          primaryText="Hello Hooray!"
          secondaryText={
            <span>
              Let also say hello! {this.state.userName}
            </span>
          }
          actionText="Open Dialog"
          actionType={ZeroDataActionType.ctaButton}
          onActionClick={this.openDialog.bind(this)}
        />
        {/* <Card className="flex-grow bolt-table-card" titleProps={{ text: "Food Inventory" }} contentProps={{ contentPadding: false }}>
          <Table
            ariaLabel="Basic Table"
            columns={fixedColumns}
            itemProvider={tableItemsNoIcons}
            role="table"
            className="table-example"
            containerClassName="h-scroll-auto"
          />
        </Card> */}
        {this.state.dialogShown && (
          <Dialog
            className="flex-wrap"
            titleProps={{ text: "Hey" }}
            onDismiss={this.closeDialog.bind(this)}
            footerButtonProps={[
              {
                text: "Close",
                primary: true,
                onClick: this.closeDialog.bind(this)
              }
            ]}
          >
            <Image
              className="content"
              alt="World image"
              src="../../../static/img/world.png"
            />
          </Dialog>
        )}
        {this.state.panelShown && (
          <Panel
            titleProps={{ text: "Hello Panel!" }}
            onDismiss={this.closePanel.bind(this)}
            footerButtonProps={[
              {
                text: "close",
                primary: true,
                onClick: this.closePanel.bind(this)
              }
            ]}
          >
            <Image
              className="content"
              alt="World image"
              src="../../../static/img/world.png"
            />
          </Panel>
        )}
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
