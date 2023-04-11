import { AppSyncResolverEvent, AppSyncResolverHandler } from 'aws-lambda';
import { Query } from '../generated/resolvers-types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const handler: AppSyncResolverHandler<Query, any> = async (
  event: AppSyncResolverEvent<Query>,
): Promise<string> => {
  console.log('====> Event:', JSON.stringify(event, null, 2));
  switch (event.info.fieldName) {
    case 'helloWorld':
      return resolveHelloWorld(event);
    default:
      throw `Unexpected query "${event.info.fieldName}" found.`;
  }
};

const resolveHelloWorld = (event: AppSyncResolverEvent<Query>): string => {
  return `Hello world at ${new Date().toISOString()}!`;
};
