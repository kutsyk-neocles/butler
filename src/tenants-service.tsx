import { ISimpleTableCell } from "azure-devops-ui/Table";

export interface ITenant {
    name: string;
    separateAcc: boolean;
}

export interface IEpicuroService {
    name: string;
    path: string;
}

export const Tenants: Array<ITenant> = [
    {
        name: 'bestseller',
        separateAcc: false
    },
    {
        name: 'esprit',
        separateAcc: true
    },
    {
        name: 'puma',
        separateAcc: false
    },
    {
        name: 'brooks',
        separateAcc: false
    },
    {
        name: 'ecco',
        separateAcc: false
    }
];

export const EpicuroServices: Array<IEpicuroService> = [
    {
        name: 'pulse-ui',
        path: '/next'
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

const getUiUri = function (tenant: ITenant, env: string, domain: string) {
    if (env == 'acc' && !tenant.separateAcc) {
        return `epicuro${tenant.name}test-${env}.${domain}`;
    }
    else if (env == 'staging') {
        return `${tenant.name}-${env}.${domain}`;
    } else if (env == 'prod') {
        return `${tenant.name}-${env}-primary.${domain}`;
    }
    else return `epicuro${tenant.name}${env}.${domain}`;
}

const getApiUri = function (tenant: ITenant, env: string, domain: string) 
{
    if (env == 'acc' && !tenant.separateAcc) {
        return `epicuro${tenant.name}testapi-${env}.${domain}`;
    }
    else if (env == 'staging') {
        return `epicuro${tenant.name}api-${env}.${domain}`;
    } else if (env == 'prod') {
        return `epicuro${tenant.name}api.${domain}`;
    }
    else return `epicuro${tenant.name}${env}api.${domain}`;
}

export interface IVersionTableItem extends ISimpleTableCell {
    serviceName: string;
    build: string;
    branch: string;
    commit: string;
}

export { getUiUri, getApiUri };