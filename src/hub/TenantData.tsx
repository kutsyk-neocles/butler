import { ISimpleListCell } from "azure-devops-ui/List";
import { ISimpleTableCell } from "azure-devops-ui/Table";

export const Tenants = [
    'bestseller',
    'esprit',
    'puma',
    'brooks',
    'ecco'
];

const servicePath = [
    '/next',
    '/api/v2/gql/accounts',
    '/api/v2/gql/baskets',
    '/api/v2/gql/feed',
    '/api/v2/gql/lists',
    '/api/v2/gql/products'
];

function getURIsForTenant(tenantName: string) {
    return servicePath.map(x => `epicuro${tenantName}test.epicurotesting.com${x}/version.json`);
}

export interface IVersionTableItem extends ISimpleTableCell {
    serviceName: string;
    build: string;
    branch: string;
    commit: string;
}

export { getURIsForTenant };