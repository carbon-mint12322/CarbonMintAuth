const FarmerCropHierarchy = {
  primaryEntity: "farmers",
  id: 1, 
  roles: [
    {
      name: "FO",
      condition: "agents"
    },
    {
      name: "ADMIN",
      condition: "agents"
    },
    {
      name: "Farmer",
      condition: "userId"
    },
  ],
  entities: [
    {
      name: "landparcel_farmers",
      filterationKey: "_id",
      condition: "farmer"
    },
    {
      name: "landparcels",
      filterationKey: "landParcel",
    },
    {
      name: "crops",
      filterationKey: "_id",
      condition: "landParcel.id"
    },
  ]
};
const FarmerEventHierarchy = {
  primaryEntity: "farmers",
  id: 2, 
  roles: [
    {
      name: "FO",
      condition: "agents"
    },
    {
      name: "ADMIN",
      condition: "agents"
    },
    {
      name: "Farmer",
      condition: "userId"
    },
  ],
  entities: [
    {
      name: "landparcel_farmers",
      filterationKey: "_id",
      condition: "farmer"
    },
    {
      name: "landparcels",
      filterationKey: "landParcel",
    },
    {
      name: "crops",
      filterationKey: "_id",
      condition: "landParcel.id"
    },
    {
      name: "events",
      filterationKey: "_id",
      condition: "cropId"
    },
  ]
};
const ServiceProvider = {
  primaryEntity: "task",
  id: 3, 
  roles: [
    {
      name: "FO",
      condition: "agents"
    },
    {
      name: "ADMIN",
      condition: "agents"
    },
  ],
  entities: [
  ]
};


export default [
  FarmerCropHierarchy,
  FarmerEventHierarchy,
  ServiceProvider,
]