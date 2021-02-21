import { ISimpleTableCell } from "azure-devops-ui/Table";

export const Tenants = [
    'bestseller',
    'esprit',
    'puma',
    'brooks',
    'ecco'
];

const getUiUri = (tenant: string, env: string, domain: string) => `epicuro${tenant}${env}.${domain}`;

const getApiUri = (tenant: string, env: string, domain: string) => `epicuro${tenant}${env}api.${domain}`;

const services = [
    {
        name: 'UI-v1',
        path: '/'
    },
    {
        name: 'pulse-ui',
        path: '/next/'
    },
    {
        name: 'accounts',
        path: '/api/v2/gql/accounts'
    },
    {
        name: 'baskets',
        path: '/api/v2/gql/baskets'
    },
    {
        name: 'feed',
        path: '/api/v2/gql/feed'
    },
    {
        name: 'lists',
        path: '/api/v2/gql/lists'
    },
    {
        name: 'products',
        path: '/api/v2/gql/products'
    }
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