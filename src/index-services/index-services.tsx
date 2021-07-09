export const PredefindReleases = [
    { name: "Backend - API" },
    { name: "Backend - Import Website" },
    { name: "Backend - Webjobs" },
    { name: "Frontend - Console V2" },
    { name: "Frontend - UI" },
    { name: "GraphQL" },
    { name: "baskets-api-CD" },
    { name: "gql-api-CD" },
    { name: "feed-api-CD" },
    { name: "lists-api-CD" },
    { name: "pulse-CD" },
    { name: "connect-api-CD" },
    { name: "reporting-system-CD" }
];

export function getReleasesFolderStructure(allReleases: any, releasesFolders: any) {
    for (let release of allReleases) {
        let relPath: string = release?.path?.substring(1) ?? "";
        let folderStructure = relPath.split('\\');
        let releaseFolder: any = releasesFolders;

        if (folderStructure.length > 1) {
            for (let j = 0; j < folderStructure.length; j++) {
                let folder = folderStructure[j];
                if (j != folderStructure.length - 1)
                    releaseFolder = releaseFolder.find((f: any) => f.id == folder).children;
                else
                    releaseFolder = releaseFolder.find((f: any) => f.id == folder);
            }
        }
        else {
            releaseFolder = releasesFolders.find((f: any) => f.id == folderStructure[0]);
        }

        if (releaseFolder) {
            if (!releaseFolder['releases'])
                releaseFolder['releases'] = [];

            releaseFolder['releases'].push(release.name);
        }
        else {
            console.log(`relPath: ${relPath}`);
        }
    }
}

export function a11yProps(index: any) {
    return {
        id: `simple-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
    };
}

export function getReleasesChooserStructure(index: number, parentId: any, releaseFolder: any) {
    let result: Array<any> = [];
    let thisFolder: any = {
        id: index++,
        name: releaseFolder.id,
        hasChild: releaseFolder.children.length > 0 || releaseFolder.releases.length > 0
    };
    if (parentId != null) {
        thisFolder['pid'] = parentId;
    }

    if (thisFolder.name.length > 0)
        result.push(thisFolder);

    let childParentId = null;
    if (thisFolder.name.length > 0) {
        childParentId = thisFolder.id;
    }
    
    if (releaseFolder.releases) {
        for (let rel of releaseFolder.releases) {
            let isInPredefined = (PredefindReleases.find(r => r.name == rel) != null);
            let relObj: any = { id: index++, name: rel, isChecked: isInPredefined };
            if (childParentId != null)
                relObj['pid'] = childParentId;
            result.push(relObj);
        }
    }


    if (thisFolder.hasChild) {
        for (let relChild of releaseFolder.children) {
            let childRes = getReleasesChooserStructure(index, childParentId, relChild);
            result = result.concat(childRes);
            index += childRes.length;
        }
    }

    return result;
}

export function genTree(row: any): any {
    const [parent, ...children] = row.split('\\');

    if (!children || children.length === 0) {
        return [{
            id: parent,
            children: []
        }];
    }

    return [{
        id: parent,
        children: genTree(children.join('\\'))
    }];
};

export function mergeDeep(children: any) {
    const res = children.reduce((result: any, curr: any) => {
        const entry = curr;
        const existing = result.find((e: any) => e.id === entry.id);

        if (existing) {
            existing.children = [].concat(existing.children, entry.children);
        } else {
            result.push(entry);
        }

        return result;
    }, []);

    for (let i = 0; i < res.length; i++) {
        const entry = res[i];
        if (entry.children && entry.children.length > 0) {
            entry.children = mergeDeep(entry.children);
        }
    };

    return res;
}