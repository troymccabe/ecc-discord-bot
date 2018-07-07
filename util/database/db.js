/**
 index.js is an import utility that grabs all models in the same folder,
 and instantiate a Sequelize object once for all models (instead of for each model).
 This is done by passing the single Sequelize object to each
 model as a reference, which each model then piggy-backs (sequelize.define())
 for creating a single db class model.
 This file is not supposed to be executed as a main class. Rather it is
 supposed to be imported (or 'required'). The actual creation of the db tables
 will be the job of the main startup code - [project_root]/bin/www by calling
 `models.sequelize.sync()` after importing from this index.js file
 */


const Sequelize = require('sequelize'); // Sequelize is a constructor
const sequelize = new Sequelize({

    // sqlite! now!
    dialect: 'mysql',

})
// pass your sequelize config here

// const Transaction = require("./model/Transaction.model");
// const AnsRecord = require("./model/AnsRecord.model");
// const Address = require("./model/Address.model");
// //
// const models = {
//     Transaction: Transaction(sequelize, Sequelize),
//     AnsRecord: AnsRecord(sequelize, Sequelize),
//     Address: Address(sequelize, Sequelize)
// };
//
// // Run `.associate` if it exists,
// // ie create relationships in the ORM
// Object.values(models)
//     .filter(model => typeof model.associate === "function")
//     .forEach(model => model.associate(models));

const db = {
    // ...models,
    sequelize,
    Sequelize
};

module.exports = db;

