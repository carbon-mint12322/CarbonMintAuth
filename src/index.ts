import {
  createAliasResolver,
  defineAbility,
  PureAbility,
  subject,
  createMongoAbility
} from "@casl/ability";

import { PermissionHierarchyItemI } from './index.interface'
import farmers from '../mockData/farmers-test.json'
import totalHierarchies from '../mockData/generatedCode'

import { dbDataWithQUery } from '../mockData/databaseMapping'

const resolverObject: any = {
  all: ["create", "get", "update", "delete", "verify", "validate"],
  rw: ["create", "get", "update", "delete"],
  ro: ["get"],
  new: ["create", "get"],
};

export { PureAbility, subject };

const resolveAction = createAliasResolver(resolverObject);


const getEntityPermissionInContext = ({ contextPermission, entity }: any) => {
  const entityAccess = contextPermission.permissions
    ?.find((contextpermit: any) => contextpermit.split('.')[0] === entity)
    ?.split('.')[1]


  return entityAccess == "*" ? "all" : entityAccess || null
}




const parseClaims = (claims: any) => {
  const parsedClaims = claims
    .map((c: string) => c.split("."))
    .map(([resource, action]: any) => {
      return [resource, action == "*" ? "all" : action];
    });

  return defineAbility(
    (can: any) => {
      parsedClaims.forEach(([resource, action]: any) => {
        if (resource.includes(':')) {
          const temp = resource.split(':')
          can(resolverObject[action], temp[0], { _id: temp[1] });
        } else {
          can(resolverObject[action], resource);
        }
      });
    },
    { resolveAction },
  );
};

const convertArrayToObject = (arr: any) =>
  arr.reduce((temp: any, ele: any) => {
    const [key, val] = ele.split(".");
    temp[key] = val;
    return temp;
  }, {});

const convertObjectToArray = (obj: Object) =>
  Object.entries(obj).map(([key, val]) => `${key}.${val}`);

const formatPermissionsFromParent = ({
  permissions,
  parentPermissions,
}: {
  permissions: string[];
  parentPermissions: string[];
}) => {
  const templatedPermissions = convertArrayToObject(permissions);
  const templatedParentPermissions = convertArrayToObject(parentPermissions);

  const finalPermissions = {
    ...templatedParentPermissions,
    ...templatedPermissions,
  };
  return convertObjectToArray(finalPermissions);
};

export const generatePermissions = ({ globalRoles, permissionHierarchy }: any) => {
  const gRoles = globalRoles;
  const roles: any = [];
  permissionHierarchy.sort((a: PermissionHierarchyItemI, b: PermissionHierarchyItemI) => (a.priority > b.priority ? 1 : -1));

  for (const { type, priority } of permissionHierarchy) {
    const allElementsOfType = gRoles.filter(
      (role: any) => role.entityType === type,
    );
    for (const selectedElementOfType of allElementsOfType) {
      const parentHierarchy = permissionHierarchy.find(
        (hier: PermissionHierarchyItemI) => hier.priority === priority - 1,
      );
      const parent = gRoles.find(
        (role: any) => role.entityType === parentHierarchy?.type,
      );
      if (parent) {
        selectedElementOfType.permissions = formatPermissionsFromParent({
          permissions: selectedElementOfType.permissions,
          parentPermissions: parent.permissions,
        });
      }

      roles.push(selectedElementOfType);
    }
  }
  return roles;
};




const generateEntityAccessSingle = ({
  contextPermission,
  subjectName,
  condition = "_id",
  data,
  currentHierarchyPrimaryPermission
}: any) => {

  const entityPermission = getEntityPermissionInContext({
    contextPermission,
    entity: subjectName
  }) || currentHierarchyPrimaryPermission;

  if (typeof condition == "object") {
    const conditionsArray = Array.from(condition)
      .map((cond: string) => ({ [cond]: { $in: data } }));
    return conditionsArray.map(condition => ({
      action: resolverObject[entityPermission],
      subject: subjectName,
      conditions: condition
    }))
  }

  return [{
    action: resolverObject[entityPermission],
    subject: subjectName,
    conditions: { [condition]: { $in: data } }
  }]


};




export const generatePermissionForEHierarchy = async ({
  requiredEntity,
  contextPermission,
  userId,
}: any) => {

  console.log({ contextPermission })

  const roles = contextPermission.roleTemplate

  const hierarchy = totalHierarchies
    .filter(({ entities, primaryEntity }) =>
      primaryEntity === requiredEntity || entities.some(entity => entity.name === requiredEntity)
    ).find(({ roles: hierRoles, primaryEntity }) => {
      const entityPermission = getEntityPermissionInContext({
        contextPermission,
        entity: primaryEntity
      });
      const isAccessToPrimaryEntity = createMongoAbility([{
        action: resolverObject[entityPermission],
        subject: primaryEntity
      }]).can('get', subject(primaryEntity, {}))
      return hierRoles.some(role => roles.includes(role.name)) && isAccessToPrimaryEntity
    });



  if (!hierarchy) {
    console.error('Improper Hierarchy');
    return;
  }

  const currentHierarchyPrimaryPermission = getEntityPermissionInContext({
    contextPermission,
    entity: hierarchy.primaryEntity
  });

  const filteredHierRoles = hierarchy.roles
    .filter(role => roles.includes(role.name))
    .map(role => role.condition);

  const entityDBQuery = [];
  const conditionsArray = Array.from(new Set(filteredHierRoles))
    .map((cond: string) => ({ [cond]: { $in: [userId] } }));
  const primaryDataQuery = { $match: { $or: conditionsArray } }
  entityDBQuery.push(primaryDataQuery)


  const entityPermissionsQuery = [];
  const primaryPermissionUpdateQuery = generateEntityAccessSingle({
    contextPermission,
    subjectName: hierarchy.primaryEntity,
    condition: new Set(filteredHierRoles),
    data: [userId],
    currentHierarchyPrimaryPermission
  });
  entityPermissionsQuery.push(...primaryPermissionUpdateQuery);
  let perms = createMongoAbility(entityPermissionsQuery);



  if (hierarchy.primaryEntity === requiredEntity) {
    return {
      entityPermissionsQuery,
      permissions: perms,
      model: hierarchy.primaryEntity,
      entityDBQuery,
    }
  }

  for (let x = 0; x < hierarchy.entities.length; x++) {
    const entity = hierarchy.entities[x];

    const entityCondition = entity?.condition || "_id"
    const entityQuery = [
      {
        $addFields: {
          [entity.filterationKey]: entityCondition === "_id" ?
            { $toObjectId: `$${entity.filterationKey}` }
            : { $toString: `$${entity.filterationKey}` }
        },
      },
      {
        $lookup: {
          from: `/reactml-dev/farmbook/${entity.name}`,
          localField: entity.filterationKey,
          foreignField: entityCondition,
          as: `${entity.name}Data`,
        },
      },
      {
        $unwind: `$${entity.name}Data`,
      },
      {
        $replaceRoot: {
          newRoot: `$${entity.name}Data`,
        },
      }
    ]
    const prevEntityData: any = await dbDataWithQUery({
      model: hierarchy.primaryEntity,
      query: entityDBQuery
    })

    const data = prevEntityData.map((it: any) => it[entity.filterationKey])
    entityDBQuery.push(...entityQuery)
    const tempEntityPermissionUpdateQuery = generateEntityAccessSingle({
      contextPermission,
      subjectName: entity.name,
      condition: entityCondition,
      data,
      currentHierarchyPrimaryPermission
    });


    entityPermissionsQuery.push(...tempEntityPermissionUpdateQuery);
    perms = createMongoAbility(entityPermissionsQuery);
    if (entity.name === requiredEntity) {
      return {
        entityPermissionsQuery,
        permissions: perms,
        model: hierarchy.primaryEntity,
        entityDBQuery,
      }
    }
  }

};
