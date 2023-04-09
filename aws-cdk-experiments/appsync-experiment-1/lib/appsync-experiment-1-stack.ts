import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
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

export class AppsyncExperiment1Stack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const graphQLApi = new CfnGraphQLApi(this, 'graphqlApi', {
      name: 'graphqlApiName',
      authenticationType: 'API_KEY',
      xrayEnabled: true,
    });
    const apiKey = new CfnApiKey(this, 'graphqlApiKey', {
      apiId: graphQLApi.attrApiId,
    });
    const graphQLSchema = new CfnGraphQLSchema(this, 'graphqlApiSchema', {
      apiId: graphQLApi.attrApiId,
      definition: readFileSync('./src/graphql/schema.graphql').toString(),
    });
    // Add lambda, plus the required datasource and resolvers, as well as create an invoke lambda role for AppSync
    const invokeLambdaRole = new Role(this, 'AppSyncInvokeLambdaRole', {
      assumedBy: new ServicePrincipal('appsync.amazonaws.com'),
    });

    const messagesLambdaFunction = new NodejsFunction(
      this,
      'messagesLambdaFunction',
      {
        entry: './src/lambda/index.ts',
        handler: 'handler',
        functionName: 'lambda-function-name',
        runtime: Runtime.NODEJS_18_X,
      },
    );

    const messagesDataSource = new CfnDataSource(this, 'messagesDataSource', {
      apiId: graphQLApi.attrApiId,
      // Note: property 'name' cannot include hyphens
      name: 'MessagesDataSource',
      type: 'AWS_LAMBDA',
      lambdaConfig: {
        lambdaFunctionArn: messagesLambdaFunction.functionArn,
      },
      serviceRoleArn: invokeLambdaRole.roleArn,
    });

    const messagesResolver = new CfnResolver(this, 'messagesResolver', {
      apiId: graphQLApi.attrApiId,
      typeName: 'Query',
      fieldName: 'messages',
      dataSourceName: messagesDataSource.name,
    });

    const welcomeMessageResolver = new CfnResolver(
      this,
      'welcomeMessageResolver',
      {
        apiId: graphQLApi.attrApiId,
        typeName: 'MessageQuery',
        fieldName: 'welcomeMessage',
        dataSourceName: messagesDataSource.name,
      },
    );

    const farewellMessageResolver = new CfnResolver(
      this,
      'farewellMessageResolver',
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

    // const webAcl = new CfnWebACL(this, 'web-acl', {
    //   defaultAction: {
    //     allow: {},
    //   },
    //   scope: 'REGIONAL',
    //   visibilityConfig: {
    //     cloudWatchMetricsEnabled: true,
    //     metricName: 'webACL',
    //     sampledRequestsEnabled: true,
    //   },
    //   rules: [
    //     {
    //       name: 'AWS-AWSManagedRulesCommonRuleSet',
    //       priority: 1,
    //       overrideAction: { none: {} },
    //       statement: {
    //         managedRuleGroupStatement: {
    //           name: 'AWSManagedRulesCommonRuleSet',
    //           vendorName: 'AWS',
    //           excludedRules: [{ name: 'SizeRestrictions_BODY' }],
    //         },
    //       },
    //       visibilityConfig: {
    //         cloudWatchMetricsEnabled: true,
    //         metricName: 'awsCommonRules',
    //         sampledRequestsEnabled: true,
    //       },
    //     },
    //   ],
    // });
    //
    // new CfnWebACLAssociation(this, 'web-acl-association', {
    //   webAclArn: webAcl.attrArn,
    //   resourceArn: graphQLApi.attrArn,
    // });

    new CfnOutput(this, 'graphqlUrl', { value: graphQLApi.attrGraphQlUrl });
    new CfnOutput(this, 'apiId', { value: graphQLApi.attrApiId || '' });
    new CfnOutput(this, 'apiKey', { value: apiKey.attrApiKey || '' });
  }
}
