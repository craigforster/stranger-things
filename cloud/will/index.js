console.log('Loading function');
const AWS = require('aws-sdk');

const keymap = {
  'A': 1,
  'B': 2,
  'C': 3,
  'D': 4,
  'E': 5,
  'F': 6,
  'G': 7,
  'H': 8,
  'I': 9,
  'J': 10,
  'K': 11,
  'L': 12,
  'M': 13,
  'N': 14,
  'O': 15,
  'P': 16,
  'Q': 17,
  'R': 18,
  'S': 19,
  'T': 20,
  'U': 21,
  'V': 22,
  'W': 23,
  'X': 24,
  'Y': 25,
  'Z': 26
}

let iotdata = new AWS.IotData({
  endpoint: process.env.IOT_ENDPOINT
});

let sqs = new AWS.SQS();

function receiveMessages(url, callback) {
  var params = {
    QueueUrl: url,
    MaxNumberOfMessages: 1
  };
  
  sqs.receiveMessage(params, function(err, data) {
    if (err) {
      console.error(err, err.stack);
      callback(err);
    } else {
      callback(null, data.Messages);
    }
  });
}

function sendToDevice(message, callback) {
  let params = {
    topic: '/request',
    payload: JSON.stringify(message),
    qos: 1
  };

  iotdata.publish(params, function(err, data) {
    if (err) {
      console.log(err, err.stack); // an error occurred
      callback(err);
      return;
    }

    console.log("message sent"); // successful response
    callback(null);
  });
}

function spell(letters, callback) {
  let normalizedLetters = letters.replace(/\s/g,'').toUpperCase();
  let numbers = normalizedLetters.split('').map((it) => keymap[it]);
  
  let message = {
    cmd: 'spell',
    args: {
      letters: numbers,
      time: 1000,
      jitter: 500
    }
  };
  
  sendToDevice(message, callback);  
}

exports.handler = function(event, context) {
  console.log(event);  
  if ( event.cmd ) {
    sendToDevice(event, function() { context.succeed('OK'); });
    return;
  }
  
  let sqs = new AWS.SQS();
  sqs.getQueueUrl({
    QueueName: process.env.QUEUE
  }, function(err, data) {
  
    let url = data.QueueUrl;
  
    // Default, poll from SQS
    receiveMessages(url, function(err, messages) {
      if ( err ) {
        context.fail(err);
      } else {
        if ( !messages || messages.length === 0 ) {
          console.log( 'nothing to do, end.' );
          context.succeed('OK');
        } else {
          let message = messages[0];
          
          if ( message.Body === '**ON' ) {
            sendToDevice({cmd: 'christmas', args: { enabled: true }}, function() { context.succeed('OK'); });
            return;
          } else if ( message.Body === '**OFF' ) {
            sendToDevice({cmd: 'christmas', args: { enabled: false }}, function() { context.succeed('OK'); });
            return;
          }
          
          spell(message.Body, function() { 
            
            console.log( 'spelling done, deleting message.' );
            sqs.deleteMessage({
              QueueUrl: url,
              ReceiptHandle: message.ReceiptHandle
            }, function(err, data) {
              if ( err ) {
                console.log( err );
                context.fail(err);
              } else {
                context.succeed('OK'); 
              }
            });
          });
        }
      }
    });
  });
}
