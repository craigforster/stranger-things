#!/bin/bash
mkdir build/
aws cloudformation package --template-file template.yml --s3-bucket craigf-stranger-things --output-template-file build/packaged-template.yml --force-upload
