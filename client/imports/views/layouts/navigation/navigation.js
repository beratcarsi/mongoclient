/*global swal*/
import {Meteor} from "meteor/meteor";
import {Template} from "meteor/templating";
import {Session} from "meteor/session";
import {FlowRouter} from "meteor/kadira:flow-router";
import {Connections} from "/lib/imports/collections/connections";
import Helper from "/client/imports/helper";
import {connect} from "/client/imports/views/layouts/top_navbar/connections/connections";
import "./add_collection/add_collection";
import "./navigation.html";

const toastr = require('toastr');

const handleNavigationAndSessions = function () {
    $('#listCollectionNames').find('li').each(function (index, li) {
        $(li).removeClass('active');
    });

    $('#listSystemCollections').find('li').each(function (index, li) {
        $(li).removeClass('active');
    });

    Session.set(Helper.strSessionSelectedCollection, undefined);
    Session.set(Helper.strSessionSelectedQuery, undefined);
    Session.set(Helper.strSessionSelectedOptions, undefined);

    $('#cmbQueries').val('').trigger('chosen:updated');
    $('#cmbAdminQueries').val('').trigger('chosen:updated');
};

const dropCollection = function (collectionName) {
    Meteor.call('dropCollection', collectionName, function (err, result) {
        if (err || result.error) {
            Helper.showMeteorFuncError(err, result, "Couldn't drop collection");
        }
        else {
            renderCollectionNames();
            toastr.success('Successfuly dropped collection: ' + collectionName);
        }
    });
};

export const renderCollectionNames = function () {
    Meteor.call('connect', Session.get(Helper.strSessionConnection), function (err, result) {
        if (err || result.error) {
            Helper.showMeteorFuncError(err, result, "Couldn't connect");
        }
        else {
            result.result.sort(function (a, b) {
                if (a.name < b.name)
                    return -1;
                else if (a.name > b.name)
                    return 1;
                else
                    return 0;
            });

            // re-set collection names
            Session.set(Helper.strSessionCollectionNames, result.result);
            // set all session values undefined except connection
            Session.set(Helper.strSessionSelectedQuery, undefined);
            Session.set(Helper.strSessionSelectedOptions, undefined);
            Session.set(Helper.strSessionSelectedCollection, undefined);
            FlowRouter.go('/databaseStats');
        }
    });
};

Template.navigation.events({
    'click #anchorShell'(e) {
        e.preventDefault();
        let connection = Connections.findOne({_id: Session.get(Helper.strSessionConnection)});

        if (connection.sshAddress) {
            toastr.info('Unfortunately, this feature is not usable in SSH connections');
            return;
        }

        if (connection.sslCertificatePath) {
            toastr.info('Unfortunately, this feature is not usable in SSL connections');
            return;
        }

        FlowRouter.go('/shell');
    },

    'click #anchorDatabaseDumpRestore'(e) {

        e.preventDefault();
        let connection = Connections.findOne({_id: Session.get(Helper.strSessionConnection)});

        if (connection.sshAddress) {
            toastr.info('Unfortunately, this feature is not usable in SSH connections');
            return;
        }

        FlowRouter.go('/databaseDumpRestore');
    },

    'click #btnRefreshCollections' (e) {
        e.preventDefault();
        connect(true);
    },

    'click #btnDropAllCollections' (e) {
        e.preventDefault();
        swal({
            title: "Are you sure?",
            text: "All collections except system, will be dropped, are you sure ?",
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: "#DD6B55",
            confirmButtonText: "Yes, drop them!",
            closeOnConfirm: false
        }, function () {
            Meteor.call('dropAllCollections', function (err, result) {
                if (err || result.error) {
                    Helper.showMeteorFuncError(err, result, "Couldn't drop all collections");
                }
                else {
                    Helper.clearSessions();
                    swal({
                        title: "Dropped!",
                        text: "Successfuly dropped all collections database ",
                        type: "success"
                    });
                }
            });
        });
    },

    'click #btnDropDatabase' (e) {
        e.preventDefault();
        swal({
            title: "Are you sure?",
            text: "You will not be able to recover this database!",
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: "#DD6B55",
            confirmButtonText: "Yes, drop it!",
            closeOnConfirm: false
        }, function () {
            Meteor.call('dropDB', function (err, result) {
                if (err || result.error) {
                    Helper.showMeteorFuncError(err, result, "Couldn't drop database");
                }
                else {
                    Helper.clearSessions();
                    swal({
                        title: "Dropped!",
                        text: "Successfuly dropped database ",
                        type: "success"
                    });
                }
            });
        });
    },


    'click .aNavigations' () {
        handleNavigationAndSessions();
    },

    'click .navCollection' (e) {
        if (e.target.id == 'btnDropCollection') {
            return;
        }

        const name = this.name;

        $('#listCollectionNames').find('li').each(function (index, li) {
            const liObject = $(li);
            if (liObject[0].textContent.substr(1).replace('Drop', '').trim() == name) {
                liObject.addClass('active');
            }
            else {
                liObject.removeClass('active');
            }
        });

        $('#listSystemCollections').find('li').each(function (index, li) {
            const liObject = $(li);
            if (liObject[0].textContent.substr(1).replace('Drop', '').trim() == name) {
                liObject.addClass('active');
            } else {
                liObject.removeClass('active');
            }
        });


        Session.set(Helper.strSessionSelectedCollection, name);
    }
});

Template.navigation.onRendered(function () {
    $.contextMenu({
        selector: ".navCollection",
        items: {
            add_collection: {
                name: "Add Collection", icon: "fa-plus", callback: function () {
                    $('#collectionAddModal').modal('show');
                }
            },
            drop_collection: {
                name: "Drop Collection", icon: "fa-trash", callback: function () {
                    if ($(this) && $(this).context && $(this).context.innerText) {
                        let collectionName = $(this).context.innerText.substring(1);
                        swal({
                            title: "Are you sure?",
                            text: collectionName + " collection will be dropped, are you sure ?",
                            type: "warning",
                            showCancelButton: true,
                            confirmButtonColor: "#DD6B55",
                            confirmButtonText: "Yes, drop it!",
                            closeOnConfirm: true
                        }, function (isConfirm) {
                            if (isConfirm) {
                                dropCollection(collectionName);
                            }
                        });
                    } else {
                        toastr.warning('No collection selected !');
                    }
                }
            }
        }
    });
});

Template.navigation.helpers({
    initializeMetisMenu() {
        Meteor.setTimeout(function () {
            const sideMenu = $('#side-menu');
            sideMenu.removeData("mm");
            sideMenu.metisMenu();
        });
    },

    getCollectionNames () {
        const collectionNames = Session.get(Helper.strSessionCollectionNames);
        if (collectionNames != undefined) {
            const result = [];
            collectionNames.forEach(function (collectionName) {
                if (!collectionName.name.startsWith('system')) {
                    result.push(collectionName);
                }
            });

            return result;
        }

        return collectionNames;
    },

    getSystemCollectionNames () {
        const collectionNames = Session.get(Helper.strSessionCollectionNames);
        if (collectionNames != undefined) {
            const result = [];
            collectionNames.forEach(function (collectionName) {
                if (collectionName.name.startsWith('system')) {
                    result.push(collectionName);
                }
            });

            return result;
        }

        return collectionNames;
    }
});