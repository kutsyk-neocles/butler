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
import { Button, CircularProgress, Divider, Grid, Link } from "@material-ui/core";
import { withStyles } from "@material-ui/styles";
import { sentenceCase } from "sentence-case";

import * as azdev from "azure-devops-node-api";
import { AzureDevOpsProjectId, OrgUrl } from "../azure-devops-values";
import * as ReleaseApi from 'azure-devops-node-api/ReleaseApi';
import * as ReleaseInterfaces from 'azure-devops-node-api/interfaces/ReleaseInterfaces';
import { getEnvironmentForReleaseAndStage, getUriForBuildId, getUriForRelease } from "../azure-devops-service";
import { DataGrid } from "@material-ui/data-grid";

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

const columns = [
  { field: 'serviceName', headerName: 'ServiceName', width: 70 },
  { field: 'primary', headerName: 'Primary', width: 130 },
  { field: 'secondary', headerName: 'Secondary', width: 130 }
];

export interface IEpicuroVersion {
  serviceName: string;
  releases: any[];
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
  }

  public async componentDidMount() {

  }

  async loadData(e: any, expanded: boolean) {
    if (expanded && this.state.deployments.length == 0) {
      const authHandler = azdev.getHandlerFromToken(this.props.token);
      const webApi = new azdev.WebApi(OrgUrl, authHandler);
      const releaseApiObject: ReleaseApi.IReleaseApi = await webApi.getReleaseApi();
      const results = [];

      this.setState({
        deployments: []
      });

      for (var serviceName of Object.keys(this.props.deployments)) {
        const requestedReleases: any[] = [];
        this.setState({
          loadingServiceName: serviceName
        });
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
            reqR.cluster = r.cluster;
            serviceVersion.releases.push(reqR);
            continue;
          }

          let releaseDetails: ReleaseInterfaces.Release = await releaseApiObject.getRelease(AzureDevOpsProjectId, r.currentRelease.id);
          let primaryArtifact = releaseDetails.artifacts?.find(x => x.isPrimary);
          let definitionReference: any = primaryArtifact?.definitionReference;
          let envId = getEnvironmentForReleaseAndStage(releaseDetails, this.props.tenant.name, this.props.env, r.cluster);

          if (definitionReference) {
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
        let linkPrimary = null;
        let branch = <Link href={row.releases[0] != null ? getUriForRelease(row.releases[0].releaseId, row.releases[0].envId) : "#"}>{row.releases[0]?.definitionReference.branches.name}</Link>;

        if (row.releases[0]) {
          linkPrimary = (
            <Link href={row.releases[0] != null ? getUriForRelease(row.releases[0].releaseId, row.releases[0].envId) : "#"}>{row.releases[0]?.releaseName}</Link>
          );

        }
        let linkSecondary = null;
        if (row.releases[1]) {
          linkSecondary = (
            <Link href={row.releases[1] != null ? getUriForRelease(row.releases[1].releaseId, row.releases[1].envId) : "#"}>{row.releases[1]?.releaseName}</Link>
          );
        }

        let defRef = row.releases[0].definitionReference;

        tableRows.push(<TableRow key={i}>
          <TableCell>
            {row.serviceName}
          </TableCell>
          <TableCell>
            <Link href={row.releases[0] != null ? getUriForBuildId(defRef.version.id) : "#"}>{defRef.version.name}</Link>
          </TableCell>
          <TableCell>
            {branch}
          </TableCell>
          <TableCell>
            {linkPrimary}
          </TableCell>
          <TableCell>
            {linkSecondary}
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
              <TableCell style={{ width: 120 }}>Service Name</TableCell>
              <TableCell style={{ width: 80 }}>Artifact</TableCell>
              <TableCell style={{ width: 80 }}>Branch</TableCell>
              <TableCell style={{ width: 120 }}>Primary</TableCell>
              <TableCell style={{ width: 120 }}>Secondary</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tableRows}
          </TableBody>
        </Table>
      </TableContainer>);
    }
    else {
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