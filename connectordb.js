/** This file is part of the ConnectorDB project.

Copyright 2016 the ConnectorDB contributors, see AUTHORS for a list of
contributors.

Licensed under the MIT license.
**/
"use strict";

function ConnectorDB(device, apikey, url) {
    url = url || "https://connectordb.com";

    this.url = url + "/api/v1/"

    this.device = device;

    this.authHeader = "Basic " + btoa(device + ":" + apikey);

}

ConnectorDB.prototype = {
    thisdevice: function () {
        return this.device;
    },

    // Internal mechanism for doing requests
    // path = /usr/dev/stream
    // reqtype = "GET" | "POST" | "PUT" | "DELETE"
    // object = undefined | posting object
    // returns a promise.
    _doRequest: function(path, reqtype, object) {
        var url = this.url + path;
        var user = this.device;
        var pass = this.apikey;
        var auth = this.authHeader

        return new Promise(function(resolve, reject) {
            var req = new XMLHttpRequest();
            //req.withCredentials = true;

            // type, url, async, basicauth credentials
            req.open(reqtype, url, true);

            req.setRequestHeader("Authorization",auth)

            // normal response from server
            req.onload = function() {
                if (req.status == 200) {
                    try {
                        resolve(JSON.parse(req.response));
                    } catch(err) {
                        resolve(req.response);
                    }
                }
                else {
                    reject(Error(req.statusText));
                }
            };

            // Handle network errors
            req.onerror = function() {
                reject(Error("Network Error"));
            };

            // Make the request
            if(object != undefined) {
                req.send(JSON.stringify(object));
            } else {
                req.send();
            }
        });
    },

    // Returns a connectordb path for the given user, dev, and stream
    // behavior is undefined if an item coming before a defined item is undefined
    // e.g. _getPath(undefined, "foo", "bar");
    _getPath: function(user, dev, stream) {
        var path = "crud/";
        if(user !== undefined) {
            path += user;
        }
        if( dev !== undefined ) {
            path += "/" + dev;
        }
        if( stream !== undefined ) {
            path += "/" + stream;
        }

        return path;
    },

    // Creates a new user
    createUser: function(username, email, password) {
        var path = this._getPath(username)
        return this._doRequest(path, "POST", {"Email":email, "Password":password});
    },

    // Reads an existing user
    readUser: function(username) {
        var path = this._getPath(username)
        return this._doRequest(path, "GET");
    },

    // Updates a user
    updateUser: function(username, structure) {
        var path = this._getPath(username)
        return this._doRequest(path, "PUT", structure);
    },

    // Deletes a given user
    deleteUser: function(username) {
        var path = this._getPath(username)
        return this._doRequest(path, "DELETE");
    },

    // Lists all the devices accessible form the user
    listDevices: function(username) {
        var path = this._getPath(username)+"?q=ls"
        return this._doRequest(path, "GET");
    },

    // Creates a device on the connectordb instance for the given user.
    createDevice: function(username, devicename) {
        var path = this._getPath(username, devicename)
        return this._doRequest(path, "POST");
    },

    // Reads a device from the connectordb server if it exists.
    readDevice: function(username, devicename) {
        var path = this._getPath(username, devicename)
        return this._doRequest(path, "GET");
    },

    // Updates a device on the connectordb server, if it does not exist
    // an error will be returned. Structure is the updated javascript object
    // that will be converted to JSON and sent.
    updateDevice: function(username, devicename, structure) {
        var path = this._getPath(username, devicename)
        return this._doRequest(path, "PUT", structure);
    },

    deleteDevice: function(username, devicename) {
        var path = this._getPath(username, devicename)
        return this._doRequest(path, "DELETE");
    },

    // Lists all the devices accessible form the user
    listStreams: function(username,devicename) {
        var path = this._getPath(username,devicename)+"?q=ls"
        return this._doRequest(path, "GET");
    },

    createStream: function(username, devicename, streamname,schema) {
        var path = this._getPath(username, devicename, streamname)
        return this._doRequest(path, "POST",schema);
    },

    readStream: function(username, devicename, streamname) {
        var path = this._getPath(username, devicename, streamname)
        return this._doRequest(path, "GET");
    },

    updateStream: function(username, devicename, streamname, structure) {
        var path = this._getPath(username, devicename, streamname)
        return this._doRequest(path, "PUT", structure);
    },

    deleteStream: function(username, devicename, streamname) {
        var path = this._getPath(username, devicename, streamname)
        return this._doRequest(path, "DELETE");
    },

    //Insert a single datapoint into the stream
    insertStream: function (username, devicename, streamname, data) {
        var datapoints = [{ t: (new Date).getTime() * 0.001, d: data }]
        var path = this._getPath(username, devicename, streamname)
        return this._doRequest(path+"/data", "PUT", datapoints);
    },

    //Get length of stream
    lengthStream: function (username, devicename, streamname) {
        var path = this._getPath(username, devicename, streamname) + "/data?q=length"
        return this._doRequest(path, "GET").then(function (result) { return parseInt(result); });
    },

    //Query by index range [i1,i2)
    indexStream: function (username, devicename, streamname,i1,i2) {
        var path = this._getPath(username, devicename, streamname) + "/data?i1=" + i1 + "&i2=" + i2;
        return this._doRequest(path, "GET");
    },

    //Query by time range [t1,t2) with a limited number of datapoints.
    //Current time is (new Date).getTime() * 0.001
    timeStream: function (username, devicename, streamname,t1,t2,limit) {
        limit = limit || 0;
        var path = this._getPath(username, devicename, streamname) + "/data?t1=" + t1 + "&t2=" + t2 + "&limit=" + limit;
        return this._doRequest(path, "GET");
    },

    // Gets a list of available transforms on the system.
    getTransforms: function() {
        return this._doRequest("meta/transforms", "GET")
    },

    // Gets a list of available transforms on the system.
    getInterpolators: function() {
        return this._doRequest("meta/interpolators", "GET")
    },

    merge: function(user, device, stream) {

        return new Merge(this);
    }
};

/** A merge request combines one or several streams together into one.
You can also perform powerful queries using pipescript.
**/
function Merge(connectordb) {
    this.connectordb = connectordb
    this.streams = []
}

Merge.prototype = {
    run: function() {
        console.log(JSON.stringify(this.streams));
        return this.connectordb._doRequest("query/merge", "POST", this.streams);
    },

    // Adds a stream to be merged and returns it so it can be initialized
    addStream: function(user, device, stream) {
        var sq = new StreamQuery(user, device, stream);

        this.streams.push(sq);

        return sq;
    },
};


/**
The steramquery can be used to run a query on a single stream in the following
manner:

sq = new StreamQuery(cdb, "foo", "bar", "baz")
                .betweenIndex(0, 1000)
                .transform("average");

this would query the first 1000 datapoints in foo/bar/baz and average them.

**/
function StreamQuery(user, device, stream) {
    this["stream"] = user + "/" + device + "/" + stream;
}

StreamQuery.prototype = {

    betweenTime: function (start, end) {
        // Set the start and end times
        this["t1"] = start;
        this["t2"] = end;

        // Remove indicies since we need one or the other
        delete this["i1"];
        delete this["i2"];

        return this;
    },

    betweenIndex: function(start, end) {
        this["i1"] = start;
        this["i2"] = end;

        // Remove times since we need one or the other
        delete this["t1"];
        delete this["t2"];

        return this;
    },

    // Limits the number of datapoints returned to the given amount
    // -1 for unlimited
    limit: function(numberOfDatapoints) {
        delete this["limit"];

        if (numberOfDatapoints > 0) {
            this["limit"] = numberOfDatapoints;
        }

        return this;
    },

    // Sets the transform for this query, use "" to unset a transform.
    transform: function(transform) {
        delete this["transform"];

        if(transform != "") {
            this["transform"] = transform;
        }

        return this;
    },
};

/**

type DatasetQuery struct {
	StreamQuery                                   //This is used for Ydatasets - setting the Stream variable will make it a Ydataset - it also holds the range
	Merge         []*StreamQuery                  `json:"merge,omitempty"`      //optional merge for Ydatasets
	Dt            float64                         `json:"dt,omitempty"`         //Used for TDatasets - setting this variable makes it a time based query
	Dataset       map[string]*DatasetQueryElement `json:"dataset"`              //The dataset to generate
	PostTransform string                          `json:"itransform,omitempty"` //The transform to run on the full datapoint after the dataset element is created
}


ConnectorDB.prototype = {
**/
