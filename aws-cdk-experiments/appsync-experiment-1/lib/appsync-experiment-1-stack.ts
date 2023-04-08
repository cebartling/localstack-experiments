import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  CfnApiKey,
  CfnGraphQLApi,
  CfnGraphQLSchema,
} from 'aws-cdk-lib/aws-appsync';
import { readFileSync } from 'fs';

export class AppsyncExperiment1Stack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const graphQLApi = new CfnGraphQLApi(this, 'graphql-api-id', {
      name: 'graphql-api-name',
      authenticationType: 'API_KEY',
    });
    const apiKey = new CfnApiKey(this, 'graphql-api-key', {
      apiId: graphQLApi.attrApiId,
    });
    const graphQLSchema = new CfnGraphQLSchema(this, 'graphql-api-schema', {
      apiId: graphQLApi.attrApiId,
      definition: readFileSync('./src/graphql/schema.graphql').toString(),
    });
  }
}
