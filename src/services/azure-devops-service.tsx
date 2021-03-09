import * as azdev from "azure-devops-node-api";
import { AzureDevOpsProjectId, OrgUrl } from "../values/azure-devops-values";
import * as ReleaseApi from 'azure-devops-node-api/ReleaseApi';
import * as ReleaseInterfaces from 'azure-devops-node-api/interfaces/ReleaseInterfaces';
import * as BuildApi from "azure-devops-node-api/BuildApi";
import * as BuildInterface from "azure-devops-node-api/interfaces/BuildInterfaces";
import { getTenantForDeploymentName } from "./tenants-service";
import { getClusterForDeploymentName, getEnvForDeploymentName } from "./envs-service";

export async function getTenantsReleasesForDefinition(releaseDefinitons: ReleaseInterfaces.ReleaseDefinition[], releaseApiObject: ReleaseApi.IReleaseApi) {
    const deployments: any = {};

    for (let i = 0; i < releaseDefinitons.length; i++) {
        const releaseDef: ReleaseInterfaces.ReleaseDefinition = releaseDefinitons[i];
        const defId: any = releaseDef.id;
        const definition = await releaseApiObject.getReleaseDefinition(AzureDevOpsProjectId, defId);
        console.log(definition);
        const definitionName = definition.name;

        if (!definitionName)
            continue;

        if (definition.environments) {
            for (let defEnv of definition.environments) {
                let deploymentName = defEnv.name;

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
                        cluster: getClusterForDeploymentName(deploymentName)
                    });
                }

            }
        }
    }
    return deployments;
}