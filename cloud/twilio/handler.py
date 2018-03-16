'''
Receive an SMS from Twilio, queue it up to spell
'''
import boto3
import random
import StringIO
import urllib2
import os

queue = os.environ['QUEUE']
client = boto3.client('sqs')

def lambda_handler(event, context):

    message = event['body']
    from_number = event['fromNumber']
    
    get_queue_url_response = client.get_queue_url(
        QueueName=queue)
        
    print get_queue_url_response
    url = get_queue_url_response.get('QueueUrl')
    
    response = client.send_message(
        QueueUrl=url,
        MessageBody=message)
        
    twilio_resp = 'OK'
    
    return twilio_resp
