import { AzureDevOpsProjectId, OrgUrl } from "./azure-devops-values";
import * as ReleaseApi from 'azure-devops-node-api/ReleaseApi';
import * as ReleaseInterfaces from 'azure-devops-node-api/interfaces/ReleaseInterfaces';
import { getTenantForDeploymentName } from "./tenants-service";
import { getClusterForDeploymentName, getEnvForDeploymentName } from "./envs-service";

export function getEnvironmentForReleaseAndStage(releaseDetails: ReleaseInterfaces.Release, tenant: string, env: string, cluster: string)
{
    if (releaseDetails && releaseDetails.environments)
    {
        let releaseEnv: any  = null;
        if (cluster == 'secondary')
        {
            releaseEnv = releaseDetails.environments.find(e => e.name?.toLowerCase().includes(tenant) && e.name?.toLowerCase().includes(env) && e.name.toLowerCase().includes(cluster));
        }
        else{
            releaseEnv = releaseDetails.environments.find(e => e.name?.toLowerCase().includes(tenant) && e.name?.toLowerCase().includes(env) && !e.name.toLowerCase().includes('secondary'));
        }
        return releaseEnv?.id ?? null;
    }
    return null;
}

export async function getTenantsReleasesForDefinition(releaseDefinitons: ReleaseInterfaces.ReleaseDefinition[], releaseApiObject: ReleaseApi.IReleaseApi) {
    const deployments: any = {};

    for (let i = 0; i < releaseDefinitons.length; i++) {
        const releaseDef: ReleaseInterfaces.ReleaseDefinition = releaseDefinitons[i];
        const defId: any = releaseDef.id;
        const definition = await releaseApiObject.getReleaseDefinition(AzureDevOpsProjectId, defId);
        const definitionName = definition.name;

        if (!definitionName)
            continue;

        if (definition.environments) {
            for (let defEnv of definition.environments) {
                let deploymentName = defEnv.name;
                let environemntId = defEnv.id;

                if (!deploymentName)
                    continue;

                let tenant = getTenantForDeploymentName(deploymentName);
                let env = getEnvForDeploymentName(deploymentName);

                if (tenant && env) {
                    if (!deployments[tenant.name])
                        deployments[tenant.name] = {};

                    if (!deployments[tenant.name][env])
                        deployments[tenant.name][env] = {};

                    if (!deployments[tenant.name][env][definitionName])
                        deployments[tenant.name][env][definitionName] = [];

                    deployments[tenant.name][env][definitionName].push({
                        currentRelease: defEnv.currentRelease,
                        envId: environemntId,
                        cluster: getClusterForDeploymentName(deploymentName)
                    });
                }

            }
        }
    }
    return deployments;
}

export function getUriForRelease(releaseId: number, envId?: number) {
    if (envId)
        return `${OrgUrl}/${AzureDevOpsProjectId}/_releaseProgress?_a=release-environment-logs&releaseId=${releaseId}&environmentId=${envId}`;
    return `${OrgUrl}/${AzureDevOpsProjectId}/_releaseProgress?releaseId=${releaseId}&_a=release-pipeline-progress`;
}