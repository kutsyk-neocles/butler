import * as React from "react";
import * as SDK from "azure-devops-extension-sdk";

import { ObservableArray, ObservableValue } from "azure-devops-ui/Core/Observable";
import { IHeaderCommandBarItem } from "azure-devops-ui/HeaderCommandBar";
import { EpicuroServices, getApiUri, getUiUri, ITenant } from "../tenants-service";
import { DomainProd, DomainTest } from "../domains-service";
import Accordion from '@material-ui/core/Accordion';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ReplayIcon from '@material-ui/icons/Replay';
import IconButton from "@material-ui/core/IconButton";
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TablePagination from '@material-ui/core/TablePagination';
import TableRow from '@material-ui/core/TableRow';
import TableSortLabel from '@material-ui/core/TableSortLabel';
import Toolbar from '@material-ui/core/Toolbar';
import Paper from '@material-ui/core/Paper';
import Tooltip from '@material-ui/core/Tooltip';
import Switch from '@material-ui/core/Switch';
import DeleteIcon from '@material-ui/icons/Delete';
import FilterListIcon from '@material-ui/icons/FilterList';

export interface IEpicuroVersion {
  serviceName: string;
  branch: string;
  build: string;
  commit: string;
}

const columns = [
  { field: 'serviceName', headerName: 'Service Name', width: 130 },
  { field: 'branch', headerName: 'Branch' },
  { field: 'build', headerName: 'Build' },
  { field: 'commit', headerName: 'Commit' }
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
    let versionForService = null;
    try {
      versionForService = await (await fetch(`https://${uri}${service.path}/version.json`)).json();
    }
    catch (e)
    {
      versionForService = {
        branch: e.message,
        build: 'Error',
        commit: 'Error'
      }
    }
    tenantResult.versions.push({
      serviceName: service.name,
      branch: versionForService.branch,
      build: versionForService.build,
      commit: versionForService.commit
    });
  }

  let uri = getApiUri(tenant, env, domain);

  let versionForApi = null;
  try {
    versionForApi = await (await fetch(`https://${uri}/version.json`)).json();
  }
  catch (e)
  {
    versionForApi = {
      branch: e.message,
      build: 'Error',
      commit: 'Error'
    }
  }

  tenantResult.versions.push({
    serviceName: 'API',
    branch: versionForApi.branch,
    build: versionForApi.build,
    commit: versionForApi.commit
  });

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
    let tenantVersions = await getVersionsForEnv(this.props.tenant, this.props.env, this.props.env == 'test' || this.props.env == 'acc' ? DomainTest : DomainProd);

    this.setState({
      tenantVersions: tenantVersions
    });
  }

  public async componentDidMount() {
    let tenantVersions = await getVersionsForEnv(this.props.tenant, this.props.env, this.props.env == 'test' || this.props.env == 'acc' ? DomainTest : DomainProd);

    this.setState({
      tenantVersions: tenantVersions
    });
  }

  public render(): JSX.Element {
    const tableItems: ObservableArray<IEpicuroVersion> = new ObservableArray(this.state.tenantVersions.versions);
    const tableRows = [];

    if (tableItems) {
      for (let i = 0; i < tableItems.length; i++) {
        const row = tableItems.value[i];
        tableRows.push(<TableRow key={i}>
          <TableCell component="th" scope="row">
            {row.serviceName}
          </TableCell>
          <TableCell align="right">{row.branch}</TableCell>
          <TableCell align="right">{row.build}</TableCell>
          <TableCell align="right">{row.commit}</TableCell>
        </TableRow>)
      }
    }

    const refreshButton = <IconButton onClick={() => this.handleUpdate()}>
      <ReplayIcon />
    </IconButton>

    return (
      <div>
        <Accordion>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-label="Expand"
            aria-controls="additional-actions3-content"
            id="additional-actions3-header"
          >
            <FormControlLabel
              aria-label="Acknowledge"
              onClick={(event) => event.stopPropagation()}
              onFocus={(event) => event.stopPropagation()}
              control={refreshButton}
              label={`${this.props.tenant.name} - ${this.props.env}`}
            />
          </AccordionSummary>
          <AccordionDetails>
            <TableContainer>
              <Table
                aria-labelledby="tableTitle"
                size={'medium'}
                aria-label="enhanced table"
              >
                <TableHead>
                  <TableRow>
                    <TableCell>Service Name</TableCell>
                    <TableCell align="right">Branch</TableCell>
                    <TableCell align="right">Build</TableCell>
                    <TableCell align="right">Commit</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tableRows}
                </TableBody>
              </Table>
            </TableContainer>
          </AccordionDetails>
        </Accordion>
      </div>
    );
  }

}