// --------------------
// Sequelize hierarchy
// Patches to unify Sequlize versions 2.x.x, 3.x.x and 4.x.x
// NOTE: Added 5.x.x in 2019
// --------------------

// modules
var semverSelect = require('semver-select');

var sequelizeVersionImported = require('sequelize/package.json').version;

// exports

// function to define patches
module.exports = function(Sequelize) {
    // get Sequelize version
    var sequelizeVersion = Sequelize.version || sequelizeVersionImported;

    // define patches
    return semverSelect.object(sequelizeVersion, {
        /*
         * Patches underscoredIf location differing in v2
         */
        underscoredIf: {
            '>=3.0.0 || >=5.0.0-beta': Sequelize.Utils.underscoredIf,
            '^2.0.0': Sequelize.Utils._? Sequelize.Utils._.underscoredIf : null,
        },
        // For some reason in v5 uppercaseFirst is missing ... assume pluralize will do the job instead
        uppercaseFirst: {
            '>=5.0.0': function uppercaseFirst(s){
                return s[0].toUpperCase() + s.slice(1);
            },
            '*': Sequelize.Utils.uppercaseFirst
          },
        /*
         * Patches to unify function signature changes between Sequelize v2 and v3
         */
        query: {
            '>=3.0.0': function(sequelize, sql, options) {
                return sequelize.query(sql, options);
            },
            '^2.0.0': function(sequelize, sql, options) {
                return sequelize.query(sql, null, options);
            },
        },
        find: {
            '>=5.0.0': function(model, options) {
                return model.findOne(options);      // .find() alias removed in v5 actual
            },
            '3.0.0 - 4.x.x': function(model, options) {
                return model.find(options);
            },
            '^2.0.0': function(model, options) {
                return model.find(options, {transaction: options.transaction, logging: options.logging});
            },
        },
        findAll: {
            '>=3.0.0': function(model, options) {
                console.log(model);
                console.log(model.testme);
                console.log('BSDebug: Yes we are using sequelize-hierarchy!!');
                return model.findAll(options);
            },
            '^2.0.0': function(model, options) {
                return model.findAll(options, {transaction: options.transaction, logging: options.logging});
            },
        },
        truncate: {
            '>=3.0.0': function(model, options) {
                options.truncate = true;
                return model.destroy(options);
            },
            // workaround for bug in sequelize v2 with `truncate` option on models with schemas
            '^2.0.0': function(model, options) {
                if (model.sequelize.options.dialect == 'postgres' && model.options.schema) {
                    options.where = {};
                } else {
                    options.truncate = true;
                }
                return model.destroy(options);
            },
        },

        /*
         * In Sequelize v2 + v3:
         *   - models are instanceof Sequelize.Model
         *   - model instances are instanceof model.Instance
         *   - model.Instance is subclass of Sequelize.Instance
         *   - models instances have a property `.Model` referring to the model they are one of
         *
         * In Sequelize v4:
         *   - models are subclasses of Sequelize.Model
         *   - model instances are instanceof their Model + therefore also instanceof Sequelize.Model
         *   - Sequelize.Instance does not exist
         *
         * The patches below account for these changes.
         */
        modelConstructor: {
            '>=4.0.0': Sequelize.Model,
            '2.0.0 - 3.x.x': Sequelize.Model.prototype,
        },
        isModelInstance: {
            '>=4.0.0': function(item) {
                return item instanceof Sequelize.Model;
            },
            '2.0.0 - 3.x.x': function(item) {
                return item instanceof Sequelize.Instance;
            },
        },
        instancePrototype: {
            '>=4.0.0': function(model) {
                return model.prototype;
            },
            '2.0.0 - 3.x.x': function(model) {
                return model.Instance.prototype;
            },
        },
        modelInit: {
            '>=4.0.0 || >=5.0.0-beta': function() {},
            '2.0.0 - 3.x.x': function(model) {
                return model.init(model.modelManager);
            },
        }
    });
};
