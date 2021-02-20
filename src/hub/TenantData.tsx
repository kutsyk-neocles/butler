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

export { getURIsForTenant };