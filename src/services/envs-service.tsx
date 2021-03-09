import { getTenantForDeploymentName } from "./tenants-service";

export const Environments = [
    'test',
    'acc',
    'staging',
    'prod'
];

export function getEnvForDeploymentName(deploymentName?: string) {
    if (deploymentName) {
        for (let env of Environments) {
            if (deploymentName.toLowerCase().indexOf(env) !== -1)
                return env;
        }

        if (getTenantForDeploymentName(deploymentName))
            return Environments[3];

        return null;
    }
    return null;
}

export function getClusterForDeploymentName(deploymentName?: string) {
    if (deploymentName) {
        if (deploymentName.toLocaleLowerCase().includes('secondary'))
            return 'secondary';
        else
            return 'primary';
    }
    return null;
}


