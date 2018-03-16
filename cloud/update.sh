#!/bin/bash
aws cloudformation update-stack --stack-name stranger-things --template-body file://./build/packaged-template.yml --capabilities CAPABILITY_IAM --region us-east-1

