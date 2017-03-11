// Enables the tests to be used directly in browser
var connectordb = (connectordb === undefined ? require("../src/index.js") : connectordb);
var expect = (expect === undefined ? require("chai")
  .expect : expect);

describe("ConnectorDB admin user", function () {
  var cdb;
  beforeEach(function () {
    // If you want to change the url, make sure allowcrossorigin is true in connectordb config
    cdb = new connectordb.ConnectorDB("test", "test", "http://localhost:3124");
  });

  it("should be able to read user", function () {
    return cdb.readUser("test")
      .then(function (result) {
        expect(result.role)
          .to.equal("admin");
      })
  });

  it("should be able to create user", function () {
    return cdb.createUser({ name: "javascript_test", email: "javacript@localhost", password: "mypass", role: "user", "public": true })
      .then(function (result) {
        expect(result.name)
          .to.equal("javascript_test");
      })
  });

  it("should be able to update user", function () {
    return cdb.updateUser("javascript_test", {
      "role": "admin"
    })
      .then(function (result) {
        expect(result.role)
          .to.equal("admin");

        return cdb.updateUser("javascript_test", {
          "role": "user"
        })
      })
      .then(function (result) {
        expect(result.role)
          .to.equal("user");
      });

  });


  it("should be able to create device", function () {
    return cdb.createDevice("javascript_test", { name: "testdevice" })
      .then(function (result) {
        expect(result.name)
          .to.equal("testdevice");
      })
  });

  it("should be able to update device", function () {
    return cdb.updateDevice("javascript_test", "testdevice", {
      "nickname": "lolcat"
    })
      .then(function (result) {
        expect(result.nickname)
          .to.equal("lolcat");
      })
  });

  it("should be able to read device", function () {
    return cdb.readDevice("javascript_test", "testdevice")
      .then(function (result) {
        expect(result.nickname)
          .to.equal("lolcat");
      })
  });

  it("should be able to list devices", function () {
    return cdb.listDevices("javascript_test")
      .then(function (result) {
        expect(result.length)
          .to.equal(3);
        var output = new Set();
        result.forEach(function (element) {
          output.add(element.name);
        });

        var expected = new Set(["user", "meta", "testdevice"]);
        expect(output)
          .to.deep.equal(expected);
        /**expect(result[0].name).to.equal("user");
        expect(result[1].name).to.equal("testdevice");**/
      })
  });

  it("should be able to create stream", function () {
    return cdb.createStream("javascript_test", "testdevice", {
      name: "mystream", schema: JSON.stringify({
        "type": "boolean"
      })
    })
      .then(function (result) {
        expect(result.name)
          .to.equal("mystream");
      })
  });

  it("should be able to update stream", function () {
    return cdb.updateStream("javascript_test", "testdevice", "mystream", {
      "downlink": true
    })
      .then(function (result) {
        expect(result.downlink)
          .to.equal(true);

        return cdb.updateStream("javascript_test", "testdevice", "mystream", {
          "downlink": false
        })
      })
  });

  it("should be able to read stream", function () {
    return cdb.readStream("javascript_test", "testdevice", "mystream")
      .then(function (result) {
        expect(result.downlink)
          .to.equal(false);
        expect(result.name)
          .to.equal("mystream")
      })
  });

  it("should be able to list streams", function () {
    return cdb.listStreams("javascript_test", "testdevice")
      .then(function (result) {
        expect(result.length)
          .to.equal(1);
        expect(result[0].name)
          .to.equal("mystream");
      });
  });

  it("should be able to list streams of user", function () {
    return cdb.listUserStreams("javascript_test")
      .then(function (result) {
        expect(result.length)
          .to.equal(1);
      });
  });

  /* The permissions here were changed - admin can no longer write devices that don't belong to it
    it("should be able to insert into stream", function() {
      return cdb.insertStream("javascript_test", "testdevice", "mystream", true)
        .then(function(result) {
          expect(result)
            .to.equal("ok");
          return cdb.insertStream("javascript_test", "testdevice", "mystream", false);
        });
    });
  
    it("should be able to get stream length", function() {
      return cdb.lengthStream("javascript_test", "testdevice", "mystream")
        .then(function(result) {
          expect(result)
            .to.equal(2); // Changed from 2 to 0
        });
    });
  
    it("should be able to read index range", function() {
      return cdb.indexStream("javascript_test", "testdevice", "mystream", 0, 5)
        .then(function(result) {
          expect(result.length)
            .to.equal(2);
          expect(result[0].d)
            .to.equal(true);
          expect(result[1].d)
            .to.equal(false);
        });
    });
  
    it("should be able to read time range", function() {
      return cdb.timeStream("javascript_test", "testdevice", "mystream", (new Date)
          .getTime() * 0.001 - 1.0, (new Date)
          .getTime() * 0.001)
        .then(function(result) {
          expect(result.length)
            .to.equal(2);
          expect(result[0].d)
            .to.equal(true);
          expect(result[1].d)
            .to.equal(false);
          return cdb.timeStream("javascript_test", "testdevice", "mystream", (new Date)
            .getTime() * 0.001 - 1.0, (new Date)
            .getTime() * 0.001, 1);
        })
        .then(function(result) {
          expect(result.length)
            .to.equal(1);
          expect(result[0].d)
            .to.equal(true);
        })
    });
  
  
    it("should be able to filter stream", function() {
      var merger = cdb.merge()
      merger.addStream("javascript_test", "testdevice", "mystream")
        .betweenIndex(0, 1)
        .transform("3 | sum")
  
      return merger.run()
        .then(function(result) {
          expect(result[0].d)
            .to.equal(3);
        })
    });*/

  it("should be able to delete stream", function () {
    return cdb.deleteStream("javascript_test", "testdevice", "mystream")
      .then(function (result) {
        expect(result)
          .to.equal("ok");
      })
  });

  it("should be able to delete device", function () {
    return cdb.deleteDevice("javascript_test", "testdevice")
      .then(function (result) {
        expect(result)
          .to.equal("ok");
      })
  });

  it("should be able to delete user", function () {
    return cdb.deleteUser("javascript_test")
      .then(function (result) {
        expect(result)
          .to.equal("ok");
      });
  });

});
