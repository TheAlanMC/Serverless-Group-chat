"use strict";

const AWS = require("aws-sdk");
const dynamo = new AWS.DynamoDB.DocumentClient();
const uuid = require("uuid");

const MESSAGE_TABLE = process.env.CHAT_MESSAGES_TABLE;
const GROUP_TABLE = process.env.CHAT_GROUPS_TABLE;
const MEMBER_TABLE = process.env.CHAT_MEMBERS_TABLE;
const CONNECTION_TABLE = process.env.CHAT_CONNECTIONS_TABLE;

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Origin,Accept,Authorization,Content-Length,X-Requested-With",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Credentials": true,
}

const successfullResponse = {
  statusCode: 200,
  headers: headers,
  body: "Success",
};


const failedResponse = (statusCode, error) => ({
  statusCode,
  headers: headers,
  body: error,
});

// Necessary for the WebSocket API
module.exports.connectHandler = (event, _context, callback) => {
  console.log("Connect handler");
  const params = {
    TableName: CONNECTION_TABLE,
    Item: {
      connectionId: event.requestContext.connectionId
    },
  };

  dynamo.put(params, (err, data) => {
    if (err) {
      console.log("Error connecting: ", err);
      callback(failedResponse(500, JSON.stringify(err)));
    } else {
      callback(null, successfullResponse)
    }
  });
}

module.exports.disconnectHandler = (event, _context, callback) => {
  deleteConnection(event.requestContext.connectionId)
    .then(() => {
      console.log(successfullResponse)
      callback(null, successfullResponse);
    })
    .catch((err) => {
      console.log(err);
      callback(failedResponse(500, JSON.stringify(err)));
    });
};

const deleteConnection = (connectionId) => {
  const params = {
    TableName: CONNECTION_TABLE,
    Key: {
      connectionId: connectionId,
    },
  };
  return dynamo.delete(params).promise();
};

module.exports.defaultHandler = (_event, _context, callback) => {
  callback(null, failedResponse(404, "No event found"));
};

// WebSocket API routes
module.exports.selectUsernameHandler = (event, _context, callback) => {
  console.log("Select username handler");
  const connectionId = event.requestContext.connectionId;
  const data = JSON.parse(event.body);
  const params = {
    TableName: CONNECTION_TABLE,
    Key: {
      connectionId: connectionId
    },
    UpdateExpression: "set username = :username",
    ExpressionAttributeValues: {
      ":username": data.username,
    },
    ReturnValues: "UPDATED_NEW",
  };

  dynamo.update(params, (err, data) => {
    if (err) {
      console.log("Error selecting username: ", err);
      callback(failedResponse(500, JSON.stringify(err)));
    } else {
      callback(null, successfullResponse);
    }
  }
  );
}

module.exports.selectGroupHandler = (event, _context, callback) => {
  console.log("Select group handler");
  const connectionId = event.requestContext.connectionId;
  const data = JSON.parse(event.body);
  const params = {
    TableName: CONNECTION_TABLE,
    Key: {
      connectionId: connectionId
    },
    UpdateExpression: "set groupId = :groupId",
    ExpressionAttributeValues: {
      ":groupId": data.groupId,
    },
    ReturnValues: "UPDATED_NEW",
  };

  dynamo.update(params, (err, data) => {
    if (err) {
      console.log("Error selecting group: ", err);
      callback(failedResponse(500, JSON.stringify(err)));
    } else {
      callback(null, successfullResponse);
    }
  }
  );
}

module.exports.sendMessageToGroupHandler = (event, _context, callback) => {
  console.log("Send message to group handler");
  const connectionId = event.requestContext.connectionId;
  const data = JSON.parse(event.body);
  const message = data.message;
  // Get the groupId and username from the connectionId
  const params = {
    TableName: CONNECTION_TABLE,
    Key: {
      connectionId: connectionId
    },
  };

  dynamo.get(params, (err, data) => {
    if (err) {
      console.log("Error getting connection: ", err);
      callback(failedResponse(500, JSON.stringify(err)));
      return;
    }
    const groupId = data.Item.groupId;
    const username = data.Item.username;
    sendMessageToGroup(groupId, connectionId, username, message, event, callback);
  }
  );
}

const sendMessageToGroup = (groupId, connectionId, username, message, event, callback) => {
  console.log("Send message to group");
  console.log("groupId: ", groupId);
  console.log("username: ", username);
  console.log("message: ", message);
  // Store the message in the MESSAGE_TABLE
  const params = {
    TableName: MESSAGE_TABLE,
    Item: {
      connectionId: connectionId,
      dateTime: Date.now().toString(),
      groupId: groupId,
      message: message,
      username: username,
    },
  };

  dynamo.put(params, (err, data) => {
    if (err) {
      console.log("Error storing message: ", err);
      callback(failedResponse(500, JSON.stringify(err)));
      return;
    }
    // Get all connections associated with the groupId
    const params = {
      TableName: CONNECTION_TABLE,
      IndexName: "groupId-index",
      KeyConditionExpression: "groupId = :groupId",
      ExpressionAttributeValues: {
        ":groupId": groupId,
      }
    };

    dynamo.query(params, (err, data) => {
      if (err) {
        console.log("Error getting connections: ", err);
        callback(failedResponse(500, JSON.stringify(err)));
        return;
      }
      console.log("Connections: ", data.Items);
      // Send the message to all connected users
      // Using send function defined below
      data.Items.forEach(connection => {
        // if (connection.connectionId === connectionId) {
        //   return;
        // }
        send({
          username: username,
          message: message,
          dateTime: Date.now().toString(),
        }, event, connection.connectionId, (err, data) => {
          if (err) {
            console.log("Error sending message: ", err);
            callback(failedResponse(500, JSON.stringify(err)));
          }
        });
      }
      );
      callback(null, successfullResponse);
    }
    );
  }
  );
}

// Necessary HTTP API
module.exports.createGroupHandler = (event, _context, callback) => {
  console.log("Create group handler");
  const data = JSON.parse(event.body);
  const params = {
    TableName: GROUP_TABLE,
    Item: {
      groupId: uuid.v1(),
      dbGroupId: data.dbGroupId,
    },
  };

  dynamo.put(params, (err, data) => {
    if (err) {
      console.log("Error creating group: ", err);
      callback(failedResponse(500, JSON.stringify(err)));
    } else {
      callback(null, {
        statusCode: 201,
        headers: headers,
        body: JSON.stringify(params.Item),
      });
    }
  });
};

module.exports.getGroupByIdHandler = (event, _context, callback) => {
  console.log("Get group by id handler");
  const dbGroupId = event.pathParameters.dbGroupId;
  const params = {
    TableName: GROUP_TABLE,
    FilterExpression: "dbGroupId = :dbGroupId",
    ExpressionAttributeValues: {
      ":dbGroupId": dbGroupId,
    },
  };

  dynamo.scan(params, (err, data) => { // Change this line
    if (err) {
      console.log("Error getting group: ", err);
      callback(failedResponse(500, JSON.stringify(err)));
    } else {
      callback(null, {
        statusCode: 200,
        headers: headers,
        body: JSON.stringify(data.Items), // Change this line
      });
    }
  });
}

module.exports.joinGroupHandler = (event, _context, callback) => {
  console.log("Join group handler");
  const data = JSON.parse(event.body);
  const params = {
    TableName: MEMBER_TABLE,
    Item: {
      groupId: data.groupId,
      memberUsername: data.username,
    },
  };

  dynamo.put(params, (err, data) => {
    if (err) {
      console.log("Error joining group: ", err);
      callback(failedResponse(500, JSON.stringify(err)));
    } else {
      callback(null, successfullResponse);
    }
  });
};

module.exports.getGroupsByUsernameHandler = (event, _context, callback) => {
  console.log("Get groups by username handler");
  const username = event.pathParameters.username;
  const params = {
    TableName: MEMBER_TABLE,
    FilterExpression: "memberUsername = :username",
    ExpressionAttributeValues: {
      ":username": username,
    },
  };

  dynamo.scan(params, (err, data) => {
    if (err) {
      console.log("Error getting groups: ", err);
      callback(failedResponse(500, JSON.stringify(err)));
    } else {
      callback(null, {
        statusCode: 200,
        headers: headers,
        body: JSON.stringify(data.Items),
      });
    }
  });
}

module.exports.getMessagesByGroupIdHandler = (event, _context, callback) => {
  console.log("Get messages by group id handler");
  const groupId = event.pathParameters.groupId;
  const params = {
    TableName: MESSAGE_TABLE,
    FilterExpression: "groupId = :groupId",
    ExpressionAttributeValues: {
      ":groupId": groupId,
    },
  };

  dynamo.scan(params, (err, data) => {
    if (err) {
      console.log("Error getting messages: ", err);
      callback(failedResponse(500, JSON.stringify(err)));
    } else {
      callback(null, {
        statusCode: 200,
        headers: headers,
        body: JSON.stringify(data.Items),
      });
    }
  });
}



const send = (data, event, connectionId) => {
  console.log("Sending...", data);

  const endpoint =
    event.requestContext.domainName + "/" + event.requestContext.stage;
  const apigwManagementApi = new AWS.ApiGatewayManagementApi({
    apiVersion: "2018-11-29",
    endpoint: endpoint,
  });
  const params = {
    ConnectionId: connectionId,
    Data: JSON.stringify(data),
  };
  console.log("params", params);
  return apigwManagementApi.postToConnection(params).promise();
};