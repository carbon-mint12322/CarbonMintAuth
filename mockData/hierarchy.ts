
export const hierarchyMain = {

    roleHierarchy: (userId: any) => {
        return {
            'FO': { agents: { $in: [userId] } },
            'ADMIN': { agents: { $in: [userId] } }
        }

    },

    hierarchyFormula: ({ userId, role }: any) => {
        return {
            farmer: (userId: string) => hierarchyMain.roleHierarchy(userId)[role] as any,
            landparcel: (landparcelIds: string[]) => { return { _id: { $in: landparcelIds } } },
            crop: (landparcelIds: string[]) => { return { "landParcel.id": { $in: landparcelIds } } },
            events: null
        }
    },
    primaryEntity: ({ userId, primaryDataSource }: any) => {
        return {
            subjectName: 'farmer',
            conditionData: userId,
            dataSource: primaryDataSource
        }
    },

}



export const hierarchy2 = {

    roleHierarchy: (userId: any) => {
        return {
            'FO': { agents: { $in: [userId] } },
            'ADMIN': null
        }

    },

    hierarchyFormula: ({ userId, role }: any) => {
        return {
            farmer: (userId: string) => hierarchyMain.roleHierarchy(userId)[role] as any,
            landparcel: (landparcelIds: string[]) => { return { _id: { $in: landparcelIds } } },
            crop: (landparcelIds: string[]) => { return { "landParcel.id": { $in: landparcelIds } } },
        }
    },
    primaryEntity: ({ userId, primaryDataSource }: any) => {
        return {
            subjectName: 'farmer',
            conditionData: userId,
            dataSource: primaryDataSource
        }
    },

}