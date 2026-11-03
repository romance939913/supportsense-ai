#!/bin/bash
set -eu

awslocal s3 mb s3://supportsense-documents-local 2>/dev/null || true
