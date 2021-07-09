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
import { Badge, Button, Chip, CircularProgress, Divider, Grid, Link, Paper } from "@material-ui/core";
import { withStyles } from "@material-ui/styles";
import { sentenceCase } from "sentence-case";

import * as azdev from "azure-devops-node-api";
import { AzureDevOpsProjectId, OrgUrl } from "../azure-devops-values";
import * as ReleaseApi from 'azure-devops-node-api/ReleaseApi';
import * as ReleaseInterfaces from 'azure-devops-node-api/interfaces/ReleaseInterfaces';
import { getEnvironmentForReleaseAndStage, getUriForBuildId, getUriForRelease } from "../azure-devops-service";

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


function getTableRow(tableItemsValue: any, i: number) {
  const row = tableItemsValue;
  let linkPrimary = EMPTY_CELL;
  let branchPrimary = EMPTY_CELL;
  let branchSecondary = EMPTY_CELL;

  if (!row.releases[0])
    return null;

  if (row.releases[0]) {
    branchPrimary = (<Link href={row.releases[0] != null ? getUriForRelease(row.releases[0].releaseId, row.releases[0].envId) : "#"}>{row.releases[0]?.definitionReference.branches.name}</Link>);
    linkPrimary = (
      <Link target="_blank" href={row.releases[0] != null ? getUriForRelease(row.releases[0].releaseId, row.releases[0].envId) : "#"}>{row.releases[0]?.releaseName}</Link>
    );
  }

  let linkSecondary = EMPTY_CELL;
  if (row.releases[1]) {
    branchSecondary = (<Link href={row.releases[0] != null ? getUriForRelease(row.releases[0].releaseId, row.releases[0].envId) : "#"}>{row.releases[0]?.definitionReference.branches.name}</Link>);
    linkSecondary = (
      <Link target="_blank" href={row.releases[1] != null ? getUriForRelease(row.releases[1].releaseId, row.releases[1].envId) : "#"}>{row.releases[1]?.releaseName}</Link>
    );
  }

  let defRef = row.releases[0].definitionReference;
  let link: any = null;

  if (row.releases[0] && defRef) {
    link = (<Link target="_blank" href={row.releases[0] != null ? getUriForBuildId(defRef.version.id) : "#"}>{defRef.version.name}</Link>);
  }
  else {
    link = ("-");
  }

  let primaryVersion = (
    <div>
      <div>
        {linkPrimary}
      </div>
      <div>
        <Chip label={branchPrimary} />
      </div>
    </div>);

  let secondaryVersion = linkSecondary !== EMPTY_CELL ? (
    <div>
      <div>
        {linkSecondary}
      </div>
      <div>
        <Chip label={branchSecondary} />
      </div>
    </div>) : EMPTY_CELL;

  return (<TableRow key={i}>
    <TableCell>
      {row.serviceName}
    </TableCell>
    <TableCell>
      {link}
    </TableCell>
    <TableCell>
      {primaryVersion}
    </TableCell>
    <TableCell>
      {secondaryVersion}
    </TableCell>
  </TableRow>);
}

export interface IEpicuroVersion {
  serviceName: string;
  releases: any[];
}

const EMPTY_CELL = (<span>-</span>);

class VersionCard extends React.Component<any, any> {

  constructor(props: any) {
    super(props);
    this.handleUpdate = this.handleUpdate.bind(this);
    this.loadData = this.loadData.bind(this);
    this.getReleasesDetails = this.getReleasesDetails.bind(this);

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
  }

  public async componentDidMount() {

  }

  async getReleasesDetails(releaseApiObject: any) {
    const results: Array<any> = [];
    for (var serviceName of Object.keys(this.props.deployments)) {
      this.setState({
        loadingServiceName: serviceName
      });
      console.log(serviceName);
      let releases = this.props.deployments[serviceName];
      let serviceVersion: any = {
        serviceName: serviceName,
        releases: Array<any>()
      };

      let requestedReleases: any[] = [];
      for (let r of releases) {
        if (!r.currentRelease.id) // release doesn't exist
          continue;

        const alreadyRequestedRelease = requestedReleases.find(reqR => reqR.releaseId == r.currentRelease.id);

        if (alreadyRequestedRelease != undefined && alreadyRequestedRelease !== null && alreadyRequestedRelease.cluster !== r.cluster) {
          alreadyRequestedRelease.cluster = r.cluster;
          serviceVersion.releases.push(alreadyRequestedRelease);
          continue;
        }

        if (alreadyRequestedRelease != undefined && alreadyRequestedRelease !== null && alreadyRequestedRelease.cluster === r.cluster)
          continue;

        let deploymentsForReleasEnv = await releaseApiObject.getDeployments(AzureDevOpsProjectId, r.definitionId, r.envId,
          null,
          null,
          null,
          ReleaseInterfaces.DeploymentStatus.Succeeded,
          null,
          true, null, 1);

        let latestDeployment = deploymentsForReleasEnv[0];
        if (!latestDeployment)
        {
          console.log(`No latest deployment for ${JSON.stringify(r)}`);
          continue;
        }

        let releaseDetails = latestDeployment.release;
        let primaryArtifact = releaseDetails.artifacts?.find(x => x.isPrimary);

        if (primaryArtifact == null)
          continue;

        let definitionReference: any = primaryArtifact.definitionReference;
        let envId = latestDeployment.releaseEnvironment.id;

        if (definitionReference != null) {
          let rel: any = {
            definitionReference: definitionReference,
            releaseName: releaseDetails.name,
            cluster: r.cluster,
            releaseId: r.currentRelease.id,
            envId: envId
          };

          serviceVersion.releases.push(rel);

          requestedReleases.push(rel);
        }
      }

      results.push(serviceVersion);
    }

    return results;
  }

  async loadData(e: any, expanded: boolean) {
    if (expanded && this.props.deployments && this.state.deployments.length != this.props.deployments.length) {
      const authHandler = azdev.getHandlerFromToken(this.props.token);
      const webApi = new azdev.WebApi(OrgUrl, authHandler);
      const releaseApiObject: ReleaseApi.IReleaseApi = await webApi.getReleaseApi();

      this.setState({
        deployments: []
      });

      if (this.props.deployments) {
        let results = await this.getReleasesDetails(releaseApiObject);

        this.setState({
          deployments: results
        });
      }

    }
  }

  public render(): JSX.Element {
    const tableItems: ObservableArray<IEpicuroVersion> = new ObservableArray(this.state.deployments);
    const tableRows: Array<any> = [];
    const { classes } = this.props;
    let body: any = null;

    if (tableItems.length > 0) {

      for (let i = 0; i < tableItems.length; i++) {
        const row = getTableRow(tableItems.value[i], i);
        if (row) {
          tableRows.push(row);
        }
      }

      body = (
        <TableContainer component={Paper}>
          <Table
            aria-labelledby="tableTitle"
            size={'medium'}
            aria-label="enhanced table"
          >
            <TableHead>
              <TableRow>
                <TableCell style={{ width: 100 }}>Service Name</TableCell>
                <TableCell style={{ width: 80 }}>Artifact</TableCell>
                <TableCell style={{ width: 130 }}>Primary</TableCell>
                <TableCell style={{ width: 130 }}>Secondary</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tableRows}
            </TableBody>
          </Table>
        </TableContainer>
      );
    }
    else {
      // No Releases or results
      if (this.props.deployments) {
        body = (
          <Grid
            container
            alignItems="center"
            direction="column">
            <CircularProgress />
            <Typography>Loading release <code>{this.state.loadingServiceName}</code> ...</Typography>
          </Grid>
        );
      }
      else {
        body = (
          <Grid
            container
            alignItems="center"
            direction="column">
            <Typography>Choose releases to show</Typography>
          </Grid>
        );
      }

    }

    return (
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

        <AccordionDetails style = {{ maxHeight: "640px" }}>
          {body}
        </AccordionDetails>
        <Divider />
        {/* <AccordionActions>
          <Button size="small" color="primary" onClick={() => this.handleUpdate()}>
            Refresh
          </Button>
        </AccordionActions> */}
      </Accordion>
    );
  }
}

export default withStyles(styles)(VersionCard);