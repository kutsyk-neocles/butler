import * as React from "react";
import * as SDK from "azure-devops-extension-sdk";

import { ObservableArray, ObservableValue } from "azure-devops-ui/Core/Observable";
import { IHeaderCommandBarItem } from "azure-devops-ui/HeaderCommandBar";
import { EpicuroServices, getApiUri, getUiUri, ITenant } from "../tenants-service";
import { DomainProd, DomainTest } from "../domains-service";
import Accordion from '@material-ui/core/Accordion';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import AccordionActions from '@material-ui/core/AccordionActions';
import { Button, CircularProgress, Divider } from "@material-ui/core";
import { withStyles } from "@material-ui/styles";
import { sentenceCase } from "sentence-case";

import * as azdev from "azure-devops-node-api";
import { AzureDevOpsProjectId, OrgUrl } from "../azure-devops-values";
import * as ReleaseApi from 'azure-devops-node-api/ReleaseApi';
import * as ReleaseInterfaces from 'azure-devops-node-api/interfaces/ReleaseInterfaces';

const styles = (theme: any) => ({
  primaryHeader: {
    'font-size': '0.9375rem',
    'flex-basis': '33.33%',
    'flex-shrink': 0
  },
  secondaryHeader: {
    color: '#c4c4c4',
    'font-size': '0.9375rem'
  }
});

export interface IEpicuroVersion {
  serviceName: string;
  releases: any[];
}

async function getVersionsForEnv(tenant: ITenant, env: string, domain: string) {
  // let tenantResult = { tenant: tenant.name, env: env, versions: new Array<IEpicuroVersion>() };

  // for (let service of EpicuroServices) {
  //   let uri = getUiUri(tenant, env, domain);
  //   let versionForService = null;
  //   try {
  //     versionForService = await (await fetch(`https://${uri}${service.path}/version.json`)).json();
  //   }
  //   catch (e) {
  //     versionForService = {
  //       branch: e.message,
  //       build: 'Error',
  //       commit: 'Error'
  //     }
  //   }
  //   tenantResult.versions.push({
  //     serviceName: service.name,
  //     branch: versionForService.branch,
  //     build: versionForService.build,
  //     commit: versionForService.commit
  //   });
  // }

  // let uri = getApiUri(tenant, env, domain);

  // let versionForApi = null;
  // try {
  //   versionForApi = await (await fetch(`https://${uri}/version.json`)).json();
  // }
  // catch (e) {
  //   versionForApi = {
  //     branch: e.message,
  //     build: 'Error',
  //     commit: 'Error'
  //   }
  // }

  // tenantResult.versions.push({
  //   serviceName: 'API',
  //   branch: versionForApi.branch,
  //   build: versionForApi.build,
  //   commit: versionForApi.commit
  // });

  // return tenantResult;
}

class VersionCard extends React.Component<any, any> {

  constructor(props: any) {
    super(props);
    this.handleUpdate = this.handleUpdate.bind(this);
    this.loadData = this.loadData.bind(this);

    this.state = {
      deployments: []
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
    // let tenantVersions = await getVersionsForEnv(this.props.tenant, this.props.env, this.props.env == 'test' || this.props.env == 'acc' ? DomainTest : DomainProd);

    // this.setState({
    //   tenantVersions: tenantVersions
    // });
  }

  public async componentDidMount() {
    // let tenantVersions = await getVersionsForEnv(this.props.tenant, this.props.env, this.props.env == 'test' || this.props.env == 'acc' ? DomainTest : DomainProd);

    // this.setState({
    //   tenantVersions: tenantVersions
    // });
  }

  async loadData(e: any, expanded: boolean) {
    if (expanded && this.state.deployments.length == 0) {
      const results = [];
      console.log(this.props.deployments);

      for (var serviceName of Object.keys(this.props.deployments)) {
        let authHandler = azdev.getHandlerFromToken(this.props.token);
        let webApi = new azdev.WebApi(OrgUrl, authHandler);
        const releaseApiObject: ReleaseApi.IReleaseApi = await webApi.getReleaseApi();
        const requestedReleases: any[] = [];

        let releases = this.props.deployments[serviceName];
        let serviceVersion = {
          serviceName: serviceName,
          releases: Array<any>()
        };

        for (let r of releases) {

          if (!r.currentRelease.id) // release doesn't exist
            continue;

          if (requestedReleases.find(reqR => reqR.id == r.currentRelease.id)) {
            const reqR = requestedReleases.find(reqR => reqR.id == r.currentRelease.id);
            serviceVersion.releases.push({
              build: reqR.build,
              branch: reqR.branch,
              cluster: r.cluster
            });
            continue;
          }

          let releaseDetails: ReleaseInterfaces.Release = await releaseApiObject.getRelease(AzureDevOpsProjectId, r.currentRelease.id);
          let primaryArtifact = releaseDetails.artifacts?.find(x => x.isPrimary);
          let definitionReference: any = primaryArtifact?.definitionReference;
          console.log(releaseDetails);
          if (definitionReference) {
            let rel: any = {
              build: definitionReference.version.name,
              branch: definitionReference.branches.name,
              cluster: r.cluster
            };
            serviceVersion.releases.push(rel);
            requestedReleases.push(
              {
                id: r.currentRelease.id,
                build: definitionReference.version.name,
                branch: definitionReference.branches.name
              });
          }
          results.push(serviceVersion);
        }
      }

      this.setState({
        deployments: results
      });
    }
  }

  public render(): JSX.Element {
    const tableItems: ObservableArray<IEpicuroVersion> = new ObservableArray(this.state.deployments);
    const tableRows = [];

    const { classes } = this.props;
    let body = null;

    if (tableItems.length > 0) {
      for (let i = 0; i < tableItems.length; i++) {
        const row = tableItems.value[i];
        tableRows.push(<TableRow key={i}>
          <TableCell component="th" scope="row">
            {row.serviceName}
          </TableCell>
          <TableCell align="right"><code>
            {row.releases[0]?.branch ?? "-"}
          </code></TableCell>
          <TableCell align="right">
            <code>
              {row.releases[1]?.branch ?? "-"}
            </code>
          </TableCell>
        </TableRow>)
      }
      body = (<TableContainer>
        <Table
          aria-labelledby="tableTitle"
          size={'medium'}
          aria-label="enhanced table"
        >
          <TableHead>
            <TableRow>
              <TableCell>Service Name</TableCell>
              <TableCell align="right">Primary</TableCell>
              <TableCell align="right">Secondary</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tableRows}
          </TableBody>
        </Table>
      </TableContainer>);
    }
    else {
      body = (<CircularProgress />);
    }

    return (
      <div>
        <Accordion onChange={this.loadData}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-label="Expand"
            aria-controls="additional-actions3-content"
            id="additional-actions3-header"
          >
            <Typography className={classes.primaryHeader}>{sentenceCase(this.props.tenant.name)}</Typography>
            <Typography className={classes.secondaryHeader}>{this.props.env}</Typography>
          </AccordionSummary>

          <AccordionDetails>
            {body}
          </AccordionDetails>
          <Divider />
          <AccordionActions>
            <Button size="small" color="primary" onClick={() => this.handleUpdate()}>
              Refresh
          </Button>
          </AccordionActions>
        </Accordion>
      </div>
    );
  }
}

export default withStyles(styles)(VersionCard);