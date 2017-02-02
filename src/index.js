/** This file is part of the ConnectorDB project.

Copyright 2016 the ConnectorDB contributors, see AUTHORS for a list of
contributors.

Licensed under the MIT license.
**/

// babel-polyfill allows polyfills for es6 elements in browsers
// This makes the js huge, so should not be used unless you're having a really bad day,
// and need old browser support
// import "babel-polyfill";

// Allows using fetch syntax (react-native and chrome for now)
fetch = typeof (fetch) == 'undefined'
  ? require("isomorphic-fetch")
  : fetch;

// The default ConnectorDB URL
const CONNECTORDB_URL = "https://connectordb.com";

/** The main ConnectorDB class */
export class ConnectorDB {
  constructor(username_or_apikey, password, url = CONNECTORDB_URL, usecookie = false) {
    this.url = url + "/api/v1/";
    this.usecookie = usecookie;

    // Allow logging in as a user or as a device (with api key)
    if (username_or_apikey === undefined) {
      // Turn on credentials
      this.authHeader = ""
    } else if (password === undefined) {
      // We log in with apikey
      this.authHeader = "Basic " + (new Buffer(":" + username_or_apikey)).toString('base64');
    } else {
      this.authHeader = "Basic " + (new Buffer(username_or_apikey + ":" + password)).toString('base64');
    }
  }

  // Internal mechanism for doing requests
  // path = /usr/dev/stream
  // reqtype = "GET" | "POST" | "PUT" | "DELETE"
  // object = undefined | posting object
  // returns a promise.
  _doRequest(path, reqtype, object) {
    let url = this.url + path;
    let pass = this.apikey;
    let auth = this.authHeader

    let requestOptions = {
      mode: 'cors',
      method: reqtype
    };

    // Allows to use no credentials in the ConnectorDB app
    if (this.usecookie) {
      requestOptions.credentials = 'include'
    }

    if (auth != "") {
      requestOptions.headers = {
        "Authorization": auth
      };
    }
    if (object != undefined) {
      requestOptions.body = JSON.stringify(object);
    }

    return fetch(url, requestOptions).then(function (response) {
      return response.text();
    }).then(function (result) {
      let res
      try {
        return JSON.parse(result);
      } catch (err) {
        return result;
      }
      if (res.hasOwnProperty("code")) {
        throw Error(res.msg + "(" + res.ref + ")");
      }
    });
  }

  // Returns a connectordb path for the given user, dev, and stream
  // behavior is undefined if an item coming before a defined item is undefined
  // e.g. _getPath(undefined, "foo", "bar");
  _getPath(user, dev, stream) {
    var path = "crud/";
    if (user !== undefined) {
      path += user;
    }
    if (dev !== undefined) {
      path += "/" + dev;
    }
    if (stream !== undefined) {
      path += "/" + stream;
    }

    return path;
  }

  // Creates a new user
  createUser(user) {
    var path = this._getPath(user.name)
    return this._doRequest(path, "POST", user);
  }

  // Reads an existing user
  readUser(username) {
    var path = this._getPath(username)
    return this._doRequest(path, "GET");
  }

  // Updates a user
  updateUser(username, structure) {
    var path = this._getPath(username)
    return this._doRequest(path, "PUT", structure);
  }

  // Deletes a given user
  deleteUser(username) {
    var path = this._getPath(username)
    return this._doRequest(path, "DELETE");
  }

  // Lists all the devices accessible form the user
  listDevices(username) {
    var path = this._getPath(username) + "?q=ls"
    return this._doRequest(path, "GET");
  }

  // Creates a device on the connectordb instance for the given user.
  createDevice(username, device) {
    var path = this._getPath(username, device.name)
    return this._doRequest(path, "POST", device);
  }

  // Reads a device from the connectordb server if it exists.
  readDevice(username, devicename) {
    var path = this._getPath(username, devicename)
    return this._doRequest(path, "GET");
  }

  // Updates a device on the connectordb server, if it does not exist
  // an error will be returned. Structure is the updated javascript object
  // that will be converted to JSON and sent.
  updateDevice(username, devicename, structure) {
    var path = this._getPath(username, devicename)
    return this._doRequest(path, "PUT", structure);
  }

  deleteDevice(username, devicename) {
    var path = this._getPath(username, devicename)
    return this._doRequest(path, "DELETE");
  }

  // Lists all the devices accessible form the user
  listStreams(username, devicename) {
    var path = this._getPath(username, devicename) + "?q=ls"
    return this._doRequest(path, "GET");
  }

  // Gets all of the streams for the specific user subject to the given constraints
  listUserStreams(username, datatype = "*", publiconly = false, downlinkonly = false, visibleonly = true) {
    var path = this._getPath(username) + "?q=streams&public=" + publiconly.toString() + "&downlink=" + downlinkonly.toString() + "&visible=" + visibleonly.toString() + "&datatype=" + encodeURIComponent(datatype);
    return this._doRequest(path, "GET");
  }

  createStream(username, devicename, stream) {
    var path = this._getPath(username, devicename, stream.name)
    return this._doRequest(path, "POST", stream);
  }

  readStream(username, devicename, streamname) {
    var path = this._getPath(username, devicename, streamname)
    return this._doRequest(path, "GET");
  }

  updateStream(username, devicename, streamname, structure) {
    var path = this._getPath(username, devicename, streamname)
    return this._doRequest(path, "PUT", structure);
  }

  deleteStream(username, devicename, streamname) {
    var path = this._getPath(username, devicename, streamname)
    return this._doRequest(path, "DELETE");
  }

  //Insert a single datapoint into the stream at current time
  insertNow(username, devicename, streamname, data) {
    var datapoints = [
      {
        t: (new Date).getTime() * 0.001,
        d: data
      }
    ];
    return this.insertStream(username, devicename, streamname, datapoints);
  }

  // Insert the given array of datapoints into the stream
  insertStream(username, devicename, streamname, datapoints) {
    var path = this._getPath(username, devicename, streamname)
    return this._doRequest(path + "/data", "PUT", datapoints);
  }

  //Get length of stream
  lengthStream(username, devicename, streamname) {
    var path = this._getPath(username, devicename, streamname) + "/data?q=length"
    return this._doRequest(path, "GET").then(function (result) {
      return parseInt(result);
    });
  }

  //Query by index range [i1,i2)
  indexStream(username, devicename, streamname, i1, i2, transform) {
    var path = this._getPath(username, devicename, streamname) + "/data?i1=" + i1 + "&i2=" + i2;
    if (transform !== undefined) {
      path = path + "&transform=" + encodeURIComponent(transform);
    }
    return this._doRequest(path, "GET");
  }

  //Query by time range [t1,t2) with a limited number of datapoints.
  //Current time is (new Date).getTime() * 0.001
  timeStream(username, devicename, streamname, t1, t2, limit, transform) {
    limit = limit || 0;
    var path = this._getPath(username, devicename, streamname) + "/data?t1=" + t1 + "&t2=" + t2 + "&limit=" + limit;
    if (transform !== undefined) {
      path = path + "&transform=" + encodeURIComponent(transform);
    }
    return this._doRequest(path, "GET");
  }

  // Gets a list of available transforms on the system.
  getTransforms() {
    return this._doRequest("meta/transforms", "GET")
  }

  // Gets a list of available transforms on the system.
  getInterpolators() {
    return this._doRequest("meta/interpolators", "GET")
  }

  merge(user, device, stream) {

    return new Merge(this);
  }



}

/** A merge request combines one or several streams together into one.
You can also perform powerful queries using pipescript.
**/
class Merge {
  constructor(connectordb) {
    this.connectordb = connectordb
    this.streams = []
  }
  run() {
    return this.connectordb._doRequest("query/merge", "POST", this.streams);
  }

  // Adds a stream to be merged and returns it so it can be initialized
  addStream(user, device, stream) {
    var sq = new StreamQuery(user, device, stream);

    this.streams.push(sq);

    return sq;
  }
}

/**
The steramquery can be used to run a query on a single stream in the following
manner:

sq = new StreamQuery(cdb, "foo", "bar", "baz")
                .betweenIndex(0, 1000)
                .transform("average");

this would query the first 1000 datapoints in foo/bar/baz and average them.

**/
class StreamQuery {
  constructor(user, device, stream) {
    this["stream"] = user + "/" + device + "/" + stream;
  }

  betweenTime(start, end) {
    // Set the start and end times
    this["t1"] = start;
    this["t2"] = end;

    // Remove indicies since we need one or the other
    delete this["i1"];
    delete this["i2"];

    return this;
  }

  betweenIndex(start, end) {
    this["i1"] = start;
    this["i2"] = end;

    // Remove times since we need one or the other
    delete this["t1"];
    delete this["t2"];

    return this;
  }

  // Limits the number of datapoints returned to the given amount
  // -1 for unlimited
  limit(numberOfDatapoints) {
    delete this["limit"];

    if (numberOfDatapoints > 0) {
      this["limit"] = numberOfDatapoints;
    }

    return this;
  }

  // Sets the transform for this query, use "" to unset a transform.
  transform(transform) {
    delete this["transform"];

    if (transform != "") {
      this["transform"] = transform;
    }

    return this;
  }
}

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
