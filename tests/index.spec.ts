import { PureAbility, subject } from '@casl/ability'
import mongoose from 'mongoose'
import { before, describe } from 'mocha';
import chai, { assert, expect } from 'chai';
import chaiHttp from 'chai-http';
import {
    // RoleEntityHierarchy,
    generateEntityAccessSingle,
    generatePermissionForEHierarchy,
    generatePermissions,
    getEntityPermissionInContext,
    parseClaimsWithQuery, resolverObject
} from '../src/index';
import { permissionHierarchy } from 'mockData/permissionHierarchy';
import { SubjectEnum, subjects } from 'mockData/subjects';
// import farmers from '../mockData/farmers.json'
import farmers from '../mockData/farmers-test.json'

import landparcelFarmers from '../mockData/landparcel_farmers.json'
import landparcels from '../mockData/landparcels.json'
import crops from '../mockData/crops.json'
import { hierarchyMain } from '../mockData/hierarchy'
import { connectDB, dbDataWithQUery, getModel } from 'mockData/databaseMapping';

// import { FarmerCropHierarchy } from '../mockData/generatedCode'
// Mock Data Start

const checkPermissionForAllSubjects = ({ permissions }: any) => {
    const allOperations = resolverObject.all
    let currentResponse: any = {}
    for (let t = 0; t < subjects.length; t++) {
        const sub = subjects[t];
        for (let x = 0; x < allOperations.length; x++) {
            const action = allOperations[x];
            const isValid = permissions.can(action, subject(sub, {}))
            // console.log(`fo: can ${action} ${sub}?`, isValid);
            currentResponse[`${sub}.${action}`] = isValid
        }
    }
    // console.log({ currentResponse })
    return currentResponse
}


// Mock Data End

chai.use(chaiHttp);
describe.skip('User Permissions', () => {
    // let generatedRoles: any = []
    before(async () => {
        // console.log({ generatedRoles: "generatedRoles" })
        return;
    });

    it('Check the abilities with single unit assignment with no parent', (done) => {
        const userRoles = [{
            "permissions": [
                "farmers.ro"
            ],
            "roleTemplate": [],
            "entityType": "unit",
            "unit": {
                "_id": "a72227e3-31a9-4379-b678-41a6dc8d9900",
                "name": "Spinka - Greenholt",
                "type": "unit",
            }
        }]
        const expectedResponse = {
            'farmer.create': false,
            'farmer.get': true,
            'farmer.update': false,
            'farmer.delete': false,
            'farmer.verify': false,
            'farmer.validate': false,
            'event.create': false,
            'event.get': false,
            'event.update': false,
            'event.delete': false,
            'event.verify': false,
            'event.validate': false,
            'landparcel.create': false,
            'landparcel.get': false,
            'landparcel.update': false,
            'landparcel.delete': false,
            'landparcel.verify': false,
            'landparcel.validate': false,
            'crop.create': false,
            'crop.get': false,
            'crop.update': false,
            'crop.delete': false,
            'crop.verify': false,
            'crop.validate': false
        }
        const generatedRoles = generatePermissions({
            globalRoles: userRoles,
            permissionHierarchy
        })
        console.log({ generatedRoles })


        const selectedUnit = "63b7805ca62c0f681fec4f50"




        const contextPermission = generatedRoles.find((role: any) =>
            role?.unit?._id === selectedUnit
        )

        const permissions = parseClaimsWithQuery({ claims: contextPermission.permissions })
        const currentResponse = checkPermissionForAllSubjects({ permissions })
        expect(currentResponse).to.deep.equal(expectedResponse);
        done()
    });




    it('Check the abilities with single unit assignment with 1 parent (cluster) overriding crop permission', async (done) => {

        const userRoles = [{
            "permissions": [
                "farmers.ro"
            ],
            "roleTemplate": [],
            "entityType": "unit",
            "unit": {
                "_id": "a72227e3-31a9-4379-b678-41a6dc8d9900",
                "name": "Spinka - Greenholt",
                "type": "unit",
            }
        },
        {
            "permissions": [
                "crop.*"
            ],
            "roleTemplate": [],
            "entityType": "cluster",
            "cluster": {
                "_id": "d2a59167-5413-4c4c-a0e4-644119edfa5c",
                "name": "Spinka - Greenholt",
                "type": "cluster",
            }
        }]
        const expectedResponse = {
            'farmer.create': false,
            'farmer.get': true,
            'farmer.update': false,
            'farmer.delete': false,
            'farmer.verify': false,
            'farmer.validate': false,
            'event.create': false,
            'event.get': false,
            'event.update': false,
            'event.delete': false,
            'event.verify': false,
            'event.validate': false,
            'landparcel.create': false,
            'landparcel.get': false,
            'landparcel.update': false,
            'landparcel.delete': false,
            'landparcel.verify': false,
            'landparcel.validate': false,
            'crop.create': true,
            'crop.get': true,
            'crop.update': true,
            'crop.delete': true,
            'crop.verify': true,
            'crop.validate': true
        }
        const generatedRoles = generatePermissions({
            globalRoles: userRoles,
            permissionHierarchy
        })

        const selectedUnit = "a72227e3-31a9-4379-b678-41a6dc8d9900"
        const contextPermission = generatedRoles.find((role: any) =>
            role?.unit?._id === selectedUnit
        )
        const permissions = parseClaimsWithQuery({ claims: contextPermission.permissions })
        const currentResponse = checkPermissionForAllSubjects({ permissions })
        expect(currentResponse).to.deep.equal(expectedResponse);
        done()
    });




    it('Check the abilities with single unit assignment with 1 parent (hub) overriding `event` permission', async (done) => {

        const userRoles = [{
            "permissions": [
                "farmers.ro"
            ],
            "roleTemplate": [],
            "entityType": "unit",
            "unit": {
                "_id": "a72227e3-31a9-4379-b678-41a6dc8d9900",
                "name": "Spinka - Greenholt",
                "type": "unit",
            }
        },
        {
            "permissions": [
                "crop.*"
            ],
            "roleTemplate": [],
            "entityType": "cluster",
            "cluster": {
                "_id": "d2a59167-5413-4c4c-a0e4-644119edfa5c",
                "name": "Spinka - Greenholt",
                "type": "cluster",
                "children": [
                    "de8b0502-91aa-4410-9ed3-e5880dcfbe0e",
                    "a72227e3-31a9-4379-b678-41a6dc8d9900"
                ]
            }
        },
        {
            "permissions": [
                "event.rw"
            ],
            "roleTemplate": [],
            "entityType": "hub",
            "hub": {
                "_id": "58a2a5ff-293c-4a5e-9b5b-242e2f67dea0",
                "name": "Schulist - Hoppe",
                "type": "hub",
                "children": [
                    "00f47502-53d0-4d38-a411-3e5c61dbdb73",
                    "d2a59167-5413-4c4c-a0e4-644119edfa5c"
                ]

            }
        }]

        const expectedResponse = {
            'farmer.create': false,
            'farmer.get': true,
            'farmer.update': false,
            'farmer.delete': false,
            'farmer.verify': false,
            'farmer.validate': false,
            'event.create': true,
            'event.get': true,
            'event.update': true,
            'event.delete': true,
            'event.verify': false,
            'event.validate': false,
            'landparcel.create': false,
            'landparcel.get': false,
            'landparcel.update': false,
            'landparcel.delete': false,
            'landparcel.verify': false,
            'landparcel.validate': false,
            'crop.create': true,
            'crop.get': true,
            'crop.update': true,
            'crop.delete': true,
            'crop.verify': true,
            'crop.validate': true
        }
        const generatedRoles = generatePermissions({
            globalRoles: userRoles,
            permissionHierarchy
        })
        const selectedUnit = "a72227e3-31a9-4379-b678-41a6dc8d9900"
        const contextPermission = generatedRoles.find((role: any) =>
            role?.unit?._id === selectedUnit
        )
        const permissions = parseClaimsWithQuery({ claims: contextPermission.permissions })
        const currentResponse = checkPermissionForAllSubjects({ permissions })
        expect(currentResponse).to.deep.equal(expectedResponse);
        done()
    });
});




describe.only('User Roles', () => {

    before(async () => {
        await connectDB()
    });

    it.only('Farmer', async () => {
        const userRoles = [
            {
                "permissions": [
                    "farmers.ro"
                ],
                "roleTemplate": [
                    "Farmer"
                ],
                "entityType": "collective",
                "entityId": "63b7805ca62c0f681fec4f50"
            },
            {
                "permissions": [
                    "landparcels.*"
                ],
                "roleTemplate": [],
                "entityType": "tenant",
                "entityId": "643fc279f6ecb1bb5a229c4f"
            }
        ]


        const user = {
            _id: "63c21f107bbc3398288d1f06",
            roles: userRoles
        }

        try {

            const generatedRoles = generatePermissions({
                globalRoles: userRoles,
                permissionHierarchy
            })
            console.log({ generatedRoles })



            const selectedUnit = "63b7805ca62c0f681fec4f50"
            const contextPermission = generatedRoles.find((role: any) =>
                role?.entityId === selectedUnit
            )




            const userId = user._id

            const values: any = {}



            const {
                entityPermissionsQuery,
                permissions,
                model,
                entityDBQuery
            }: any = await generatePermissionForEHierarchy({
                requiredEntity: 'landparcels',
                contextPermission,
                userId
            })


            const entityData: any = await dbDataWithQUery({
                model,
                query: entityDBQuery
            })



            console.log({ model, entityDBQuery, entityData })

            // for (let index = 0; index < subjects.length; index++) {
            //     const subjectValue = subjects[index];
            //     const { entityPermissionsQuery, permissions, model, entityDBQuery }: any = await generatePermissionForEHierarchy({
            //         requiredEntity: subjectValue,
            //         contextPermission,
            //         userId
            //     })

            //     const entityData: any = await dbDataWithQUery({
            //         model,
            //         query: entityDBQuery
            //     })
            //     const filterEntityData = entityData.filter((entityItem: any) =>
            //         permissions.can('get', subject(subjectValue, entityItem))
            //     );






            //     expect(entityData).to.deep.equal(filterEntityData)

            //     values[subjectValue] = entityData.length
            // }



            // const expectedResponse = { farmers: 1, landparcels: 2, crops: 4, events: 2 }

            // expect(values).to.deep.equal(expectedResponse)

            // Verify validity of filtered entity

        } catch (error) {
            console.log({ error })
        }
    });



    // it('Field Officer', async () => {



    //     const userRoles = [{
    //         "permissions": [
    //             "farmers.ro",
    //         ],
    //         "roleTemplate": ['FO'],
    //         "entityType": "unit",
    //         "unit": {
    //             "_id": "a72227e3-31a9-4379-b678-41a6dc8d9900",
    //             "name": "Spinka - Greenholt",
    //             "type": "unit",
    //         }
    //     },
    //     {
    //         "permissions": [
    //             "crops.*"
    //         ],
    //         "roleTemplate": [],
    //         "entityType": "cluster",
    //         "cluster": {
    //             "_id": "d2a59167-5413-4c4c-a0e4-644119edfa5c",
    //             "name": "Spinka - Greenholt",
    //             "type": "cluster",
    //             "children": [
    //                 "de8b0502-91aa-4410-9ed3-e5880dcfbe0e",
    //                 "a72227e3-31a9-4379-b678-41a6dc8d9900"
    //             ]
    //         }
    //     },
    //     {
    //         "permissions": [
    //             "events.rw"
    //         ],
    //         "roleTemplate": [],
    //         "entityType": "hub",
    //         "hub": {
    //             "_id": "58a2a5ff-293c-4a5e-9b5b-242e2f67dea0",
    //             "name": "Schulist - Hoppe",
    //             "type": "hub",
    //             "children": [
    //                 "00f47502-53d0-4d38-a411-3e5c61dbdb73",
    //                 "d2a59167-5413-4c4c-a0e4-644119edfa5c"
    //             ]

    //         }
    //     }]


    //     const user = {
    //         _id: "65829615e0340b3cb774dcdb",
    //         roles: userRoles
    //     }

    //     try {

    //         const generatedRoles = generatePermissions({
    //             globalRoles: userRoles,
    //             permissionHierarchy
    //         })
    //         const selectedUnit = "a72227e3-31a9-4379-b678-41a6dc8d9900"
    //         const contextPermission = generatedRoles.find((role: any) =>
    //             role?.unit?._id === selectedUnit
    //         )
    //         const userId = user._id


    //         const values: any = {}
    //         for (let index = 0; index < subjects.length; index++) {
    //             const subjectValue = subjects[index];
    //             const { entityPermissionsQuery, permissions, model, entityDBQuery }: any = await generatePermissionForEHierarchy({
    //                 requiredEntity: subjectValue,
    //                 contextPermission,
    //                 userId
    //             })

    //             // console.log({ entityDBQuery: JSON.stringify(entityDBQuery) })

    //             const entityData: any = await dbDataWithQUery({
    //                 model,
    //                 query: entityDBQuery
    //             })
    //             const filterEntityData = entityData.filter((entityItem: any) =>
    //                 permissions.can('get', subject(subjectValue, entityItem))
    //             );
    //             expect(entityData).to.deep.equal(filterEntityData)

    //             values[subjectValue] = entityData.length
    //         }
    //         const expectedResponse = { farmers: 5, landparcels: 6, crops: 11, events: 31 }
    //         expect(values).to.deep.equal(expectedResponse)

    //         // Verify validity of filtered entity

    //     } catch (error) {
    //         console.log({ error })
    //     }
    // });

    // it('Field Officer and Farmer', async () => {



    //     const userRoles = [{
    //         "permissions": [
    //             "farmers.ro",
    //         ],
    //         "roleTemplate": ['FO', 'Farmer'],
    //         "entityType": "unit",
    //         "unit": {
    //             "_id": "a72227e3-31a9-4379-b678-41a6dc8d9900",
    //             "name": "Spinka - Greenholt",
    //             "type": "unit",
    //         }
    //     },
    //     {
    //         "permissions": [
    //             "crops.*"
    //         ],
    //         "roleTemplate": [],
    //         "entityType": "cluster",
    //         "cluster": {
    //             "_id": "d2a59167-5413-4c4c-a0e4-644119edfa5c",
    //             "name": "Spinka - Greenholt",
    //             "type": "cluster",
    //             "children": [
    //                 "de8b0502-91aa-4410-9ed3-e5880dcfbe0e",
    //                 "a72227e3-31a9-4379-b678-41a6dc8d9900"
    //             ]
    //         }
    //     },
    //     {
    //         "permissions": [
    //             "events.rw"
    //         ],
    //         "roleTemplate": [],
    //         "entityType": "hub",
    //         "hub": {
    //             "_id": "58a2a5ff-293c-4a5e-9b5b-242e2f67dea0",
    //             "name": "Schulist - Hoppe",
    //             "type": "hub",
    //             "children": [
    //                 "00f47502-53d0-4d38-a411-3e5c61dbdb73",
    //                 "d2a59167-5413-4c4c-a0e4-644119edfa5c"
    //             ]

    //         }
    //     }]


    //     const user = {
    //         _id: "65829615e0340b3cb774dcdb",
    //         roles: userRoles
    //     }

    //     try {

    //         const generatedRoles = generatePermissions({
    //             globalRoles: userRoles,
    //             permissionHierarchy
    //         })
    //         const selectedUnit = "a72227e3-31a9-4379-b678-41a6dc8d9900"
    //         const contextPermission = generatedRoles.find((role: any) =>
    //             role?.unit?._id === selectedUnit
    //         )
    //         const userId = user._id


    //         const values: any = {}
    //         for (let index = 0; index < subjects.length; index++) {
    //             const subjectValue = subjects[index];
    //             const { entityPermissionsQuery, permissions, model, entityDBQuery }: any = await generatePermissionForEHierarchy({
    //                 requiredEntity: subjectValue,
    //                 contextPermission,
    //                 userId
    //             })

    //             const entityData: any = await dbDataWithQUery({
    //                 model,
    //                 query: entityDBQuery
    //             })
    //             const filterEntityData = entityData.filter((entityItem: any) =>
    //                 permissions.can('get', subject(subjectValue, entityItem))
    //             );
    //             expect(entityData).to.deep.equal(filterEntityData)

    //             values[subjectValue] = entityData.length
    //         }
    //         const expectedResponse = { farmers: 6, landparcels: 8, crops: 15, events: 33 }
    //         expect(values).to.deep.equal(expectedResponse)

    //         // Verify validity of filtered entity

    //     } catch (error) {
    //         console.log({ error })
    //     }
    // });





}); 
