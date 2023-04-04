import * as cdk from 'aws-cdk-lib';
import {Stack, StackProps} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';

export class LambdaExperiment1Stack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const lambdaFunction = new lambda.Function(this, 'lambda-function', {
      runtime: lambda.Runtime.NODEJS_18_X,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(5),
      handler: 'index.main',
      code: lambda.Code.fromAsset(path.join(__dirname, '/../src/new-lambda')),
      environment: {
        REGION: cdk.Stack.of(this).region,
        AVAILABILITY_ZONES: JSON.stringify(
          cdk.Stack.of(this).availabilityZones,
        ),
      },
    });

    // 👇 create a policy statement
    const listBucketsPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['s3:ListAllMyBuckets'],
      resources: ['arn:aws:s3:::*'],
    });

    // 👇 attach the policy to the function's role
    lambdaFunction.role?.attachInlinePolicy(
      new iam.Policy(this, 'list-buckets', {
        statements: [listBucketsPolicy],
      }),
    );
  }
}
