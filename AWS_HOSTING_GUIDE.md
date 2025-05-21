# Hosting All PDF Tools on AWS

This guide provides detailed instructions for deploying the All PDF Tools application on Amazon Web Services (AWS). AWS offers a comprehensive suite of cloud services that can be used to host scalable, reliable, and secure web applications.

## Prerequisites

- AWS account
- AWS CLI installed and configured
- Git installed
- Node.js (v18 or later) installed
- Python (v3.9 or later) installed
- Basic knowledge of AWS services

## Architecture Overview

We'll use the following AWS services:

- **AWS Amplify**: For hosting the Next.js frontend
- **AWS Lambda**: For running the FastAPI backend
- **Amazon API Gateway**: For creating a RESTful API that connects to Lambda
- **Amazon S3**: For storing uploaded and processed PDF files
- **Amazon CloudFront**: For content delivery (optional)
- **AWS IAM**: For managing permissions

## Step 1: Set Up the Frontend with AWS Amplify

AWS Amplify provides a git-based workflow for deploying and hosting fullstack serverless web applications.

### 1.1. Install the Amplify CLI

```bash
npm install -g @aws-amplify/cli
amplify configure
```

Follow the prompts to create an IAM user with appropriate permissions.

### 1.2. Initialize Amplify in Your Project

```bash
cd all-pdf-tools-nextjs/frontend
amplify init
```

Follow the prompts to configure your project:
- Enter a name for the project
- Choose your default editor
- Choose JavaScript as the type of app
- Choose React as the framework
- Choose npm as the package manager
- Provide the source directory path (src)
- Provide the distribution directory path (build)
- Provide the build command (npm run build)
- Provide the start command (npm start)

### 1.3. Add Hosting to Your Project

```bash
amplify add hosting
```

Choose "Hosting with Amplify Console" and "Continuous deployment".

### 1.4. Deploy the Frontend

```bash
amplify publish
```

This will create the necessary resources and deploy your frontend application.

## Step 2: Set Up the Backend with AWS Lambda and API Gateway

### 2.1. Prepare the Backend Code

First, we need to modify the backend code to work with AWS Lambda:

1. Install the required packages:

```bash
cd ../backend
pip install mangum
```

2. Update the `main.py` file to work with AWS Lambda:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
import os

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.environ.get("CORS_ORIGINS", "*")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import your routes
from routes import pdf_routes
app.include_router(pdf_routes.router)

# Create handler for AWS Lambda
handler = Mangum(app)
```

### 2.2. Create a Deployment Package

Create a deployment package for AWS Lambda:

```bash
# Create a requirements.txt file
pip freeze > requirements.txt

# Create a deployment package
mkdir -p package
pip install --target ./package -r requirements.txt
cd package
zip -r ../lambda_function.zip .
cd ..
zip -g lambda_function.zip main.py
# Add all other Python files and directories
zip -g lambda_function.zip -r routes models utils
```

### 2.3. Create an S3 Bucket for File Storage

```bash
aws s3 mb s3://all-pdf-tools-files
```

### 2.4. Create an IAM Role for Lambda

Create a file named `lambda-role-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

Create a file named `lambda-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::all-pdf-tools-files",
        "arn:aws:s3:::all-pdf-tools-files/*"
      ]
    }
  ]
}
```

Create the IAM role and attach the policy:

```bash
aws iam create-role --role-name lambda-pdf-tools-role --assume-role-policy-document file://lambda-role-policy.json
aws iam put-role-policy --role-name lambda-pdf-tools-role --policy-name lambda-pdf-tools-policy --policy-document file://lambda-policy.json
```

### 2.5. Create the Lambda Function

```bash
aws lambda create-function \
  --function-name pdf-tools-api \
  --runtime python3.9 \
  --handler main.handler \
  --role arn:aws:iam::<your-account-id>:role/lambda-pdf-tools-role \
  --zip-file fileb://lambda_function.zip \
  --timeout 30 \
  --memory-size 512 \
  --environment Variables={CORS_ORIGINS=https://your-amplify-app.amplifyapp.com,S3_BUCKET=all-pdf-tools-files}
```

Replace `<your-account-id>` with your AWS account ID and update the CORS_ORIGINS value with your Amplify app URL.

### 2.6. Create an API Gateway

```bash
# Create the API
aws apigateway create-rest-api --name "PDF Tools API" --description "API for PDF Tools"

# Get the API ID
API_ID=$(aws apigateway get-rest-apis --query "items[?name=='PDF Tools API'].id" --output text)

# Get the root resource ID
ROOT_RESOURCE_ID=$(aws apigateway get-resources --rest-api-id $API_ID --query "items[?path=='/'].id" --output text)

# Create a resource
aws apigateway create-resource --rest-api-id $API_ID --parent-id $ROOT_RESOURCE_ID --path-part "{proxy+}"
RESOURCE_ID=$(aws apigateway get-resources --rest-api-id $API_ID --query "items[?path=='/{proxy+}'].id" --output text)

# Create a method
aws apigateway put-method --rest-api-id $API_ID --resource-id $RESOURCE_ID --http-method ANY --authorization-type NONE

# Set up the Lambda integration
aws apigateway put-integration \
  --rest-api-id $API_ID \
  --resource-id $RESOURCE_ID \
  --http-method ANY \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri arn:aws:apigateway:<your-region>:lambda:path/2015-03-31/functions/arn:aws:lambda:<your-region>:<your-account-id>:function:pdf-tools-api/invocations

# Deploy the API
aws apigateway create-deployment --rest-api-id $API_ID --stage-name prod

# Add permission for API Gateway to invoke Lambda
aws lambda add-permission \
  --function-name pdf-tools-api \
  --statement-id apigateway-prod \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:<your-region>:<your-account-id>:$API_ID/*/ANY/{proxy+}"
```

Replace `<your-region>` with your AWS region and `<your-account-id>` with your AWS account ID.

## Step 3: Connect Frontend to Backend

### 3.1. Update the Frontend Configuration

Update the environment variables in your Amplify app:

1. Go to the AWS Amplify Console
2. Select your app
3. Go to "Environment variables"
4. Add a new variable:
   - Key: `NEXT_PUBLIC_API_URL`
   - Value: `https://<api-id>.execute-api.<your-region>.amazonaws.com/prod`

Replace `<api-id>` with your API Gateway ID and `<your-region>` with your AWS region.

### 3.2. Redeploy the Frontend

```bash
cd ../frontend
amplify publish
```

## Step 4: Set Up Custom Domain (Optional)

### 4.1. Configure a Custom Domain for Amplify

1. Go to the AWS Amplify Console
2. Select your app
3. Go to "Domain management"
4. Click "Add domain"
5. Follow the prompts to set up your custom domain

### 4.2. Configure a Custom Domain for API Gateway

1. Go to the API Gateway Console
2. Select your API
3. Go to "Custom domain names"
4. Click "Create"
5. Follow the prompts to set up your custom domain

## Step 5: Monitoring and Maintenance

### 5.1. Set Up CloudWatch Alarms

```bash
# Create a CloudWatch alarm for Lambda errors
aws cloudwatch put-metric-alarm \
  --alarm-name "PDF-Tools-Lambda-Errors" \
  --alarm-description "Alarm when Lambda function has errors" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 60 \
  --threshold 1 \
  --comparison-operator GreaterThanOrEqualToThreshold \
  --dimensions Name=FunctionName,Value=pdf-tools-api \
  --evaluation-periods 1 \
  --alarm-actions arn:aws:sns:<your-region>:<your-account-id>:lambda-alerts
```

Replace `<your-region>` with your AWS region and `<your-account-id>` with your AWS account ID.

### 5.2. Set Up Automated Backups

Create a Lambda function to back up your S3 bucket:

```python
import boto3
import datetime

def lambda_handler(event, context):
    s3 = boto3.resource('s3')
    source_bucket = s3.Bucket('all-pdf-tools-files')
    dest_bucket = s3.Bucket('all-pdf-tools-backups')
    
    timestamp = datetime.datetime.now().strftime('%Y-%m-%d-%H-%M-%S')
    
    for obj in source_bucket.objects.all():
        copy_source = {
            'Bucket': 'all-pdf-tools-files',
            'Key': obj.key
        }
        dest_bucket.copy(copy_source, f"{timestamp}/{obj.key}")
    
    return {
        'statusCode': 200,
        'body': f'Backup completed at {timestamp}'
    }
```

Deploy this Lambda function and set up a CloudWatch Events rule to trigger it daily.

## Troubleshooting

### Common Issues

#### CORS Errors

If you encounter CORS errors:

1. Check that the `CORS_ORIGINS` environment variable in the Lambda function is set correctly
2. Ensure the API Gateway has CORS enabled
3. Verify that the frontend is making requests to the correct API URL

#### Lambda Deployment Issues

If the Lambda deployment fails:

1. Check that the deployment package includes all required dependencies
2. Verify that the IAM role has the necessary permissions
3. Check the Lambda function logs in CloudWatch

#### API Gateway Issues

If the API Gateway is not working:

1. Check that the integration with Lambda is set up correctly
2. Verify that the Lambda function has permission to be invoked by API Gateway
3. Test the API directly using a tool like Postman or curl

## Cost Optimization

AWS services are billed based on usage. Here are some tips to optimize costs:

1. Use AWS Lambda's free tier (1 million requests per month)
2. Use S3's free tier (5 GB of storage)
3. Set up budget alerts to monitor your spending
4. Consider using Reserved Instances for EC2 if you're using them
5. Use CloudFront to reduce data transfer costs

## Security Best Practices

1. Use IAM roles with the principle of least privilege
2. Enable AWS CloudTrail to audit API calls
3. Use AWS WAF to protect against common web exploits
4. Enable encryption for data at rest and in transit
5. Regularly rotate access keys and credentials

## Conclusion

You have now successfully deployed the All PDF Tools application on AWS. This setup provides a scalable, reliable, and secure environment for your application.

For more information, refer to:
- [AWS Amplify Documentation](https://docs.aws.amazon.com/amplify/)
- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)
- [Amazon API Gateway Documentation](https://docs.aws.amazon.com/apigateway/)
- [Amazon S3 Documentation](https://docs.aws.amazon.com/s3/)
