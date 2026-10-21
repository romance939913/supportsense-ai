# AWS setup for the deployed API

The application already uses the private `supportsense-ai-documents` bucket in
`us-east-1`. Its account-level public access block is enabled and it uses
SSE-S3 encryption. The API stores document objects under `documents/`.

For the deployed API, create a dedicated runtime IAM identity and attach
[`supportsense-runtime-s3-policy.json`](supportsense-runtime-s3-policy.json).
This grants object read, write, and delete access only below `documents/` in
that bucket. It does not grant bucket listing or bucket configuration access.
Keep the generated access key only in the hosting provider's secret settings;
do not put it in this repository or reuse the personal IAM credentials used
for local development.
