import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  CfnApiKey,
  CfnDataSource,
  CfnGraphQLApi,
  CfnGraphQLSchema,
  CfnResolver,
} from 'aws-cdk-lib/aws-appsync';
import { readFileSync } from 'fs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import {
  Effect,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from 'aws-cdk-lib/aws-iam';
import { CfnWebACL, CfnWebACLAssociation } from 'aws-cdk-lib/aws-wafv2';

export class AppsyncExperiment1Stack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const graphQLApi = new CfnGraphQLApi(this, 'graphql-api-id', {
      name: 'graphql-api-name',
      authenticationType: 'API_KEY',
      xrayEnabled: true,
    });
    const apiKey = new CfnApiKey(this, 'graphql-api-key', {
      apiId: graphQLApi.attrApiId,
    });
    const graphQLSchema = new CfnGraphQLSchema(this, 'graphql-api-schema', {
      apiId: graphQLApi.attrApiId,
      definition: readFileSync('./src/graphql/schema.graphql').toString(),
    });
    // Add lambda, plus the required datasource and resolvers, as well as create an invoke lambda role for AppSync
    const invokeLambdaRole = new Role(this, 'AppSync-InvokeLambdaRole', {
      assumedBy: new ServicePrincipal('appsync.amazonaws.com'),
    });

    const messagesLambdaFunction = new NodejsFunction(
      this,
      'messages-lambda-id',
      {
        entry: './src/lambda/index.ts',
        handler: 'handler',
        functionName: 'lambda-function-name',
        runtime: Runtime.NODEJS_18_X,
      },
    );

    const messagesDataSource = new CfnDataSource(this, 'messages-datasource', {
      apiId: graphQLApi.attrApiId,
      // Note: property 'name' cannot include hyphens
      name: 'MessagesDataSource',
      type: 'AWS_LAMBDA',
      lambdaConfig: {
        lambdaFunctionArn: messagesLambdaFunction.functionArn,
      },
      serviceRoleArn: invokeLambdaRole.roleArn,
    });

    const messagesResolver = new CfnResolver(this, 'messages-resolver', {
      apiId: graphQLApi.attrApiId,
      typeName: 'Query',
      fieldName: 'messages',
      dataSourceName: messagesDataSource.name,
    });

    const welcomeMessageResolver = new CfnResolver(
      this,
      'welcomeMessage-resolver',
      {
        apiId: graphQLApi.attrApiId,
        typeName: 'MessageQuery',
        fieldName: 'welcomeMessage',
        dataSourceName: messagesDataSource.name,
      },
    );

    const farewellMessageResolver = new CfnResolver(
      this,
      'farewellMessage-resolver',
      {
        apiId: graphQLApi.attrApiId,
        typeName: 'MessageQuery',
        fieldName: 'farewellMessage',
        dataSourceName: messagesDataSource.name,
      },
    );

    // Ensures that the resolvers are created after the schema.
    messagesResolver.addDependency(graphQLSchema);
    welcomeMessageResolver.addDependency(graphQLSchema);
    farewellMessageResolver.addDependency(graphQLSchema);

    // Ensures that AppSync is able to invoke the lambda function.
    invokeLambdaRole.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        resources: [messagesLambdaFunction.functionArn],
        actions: ['lambda:InvokeFunction'],
      }),
    );

    const webAcl = new CfnWebACL(this, 'web-acl', {
      defaultAction: {
        allow: {},
      },
      scope: 'REGIONAL',
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: 'webACL',
        sampledRequestsEnabled: true,
      },
      rules: [
        {
          name: 'AWS-AWSManagedRulesCommonRuleSet',
          priority: 1,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              name: 'AWSManagedRulesCommonRuleSet',
              vendorName: 'AWS',
              excludedRules: [{ name: 'SizeRestrictions_BODY' }],
            },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'awsCommonRules',
            sampledRequestsEnabled: true,
          },
        },
      ],
    });

    new CfnWebACLAssociation(this, 'web-acl-association', {
      webAclArn: webAcl.attrArn,
      resourceArn: graphQLApi.attrArn,
    });
  }
}
