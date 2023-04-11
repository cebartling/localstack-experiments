import { AppSyncResolverEvent, AppSyncResolverHandler } from 'aws-lambda';
import { Query, Stock } from '../generated/resolvers-types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const handler: AppSyncResolverHandler<Query, any> = async (
  event: AppSyncResolverEvent<Query>,
): Promise<string | Stock> => {
  console.log('====> Event:', JSON.stringify(event, null, 2));
  switch (event.info.fieldName) {
    case 'helloWorld':
      return resolveHelloWorld(event);
    case 'symbolLookup':
      return resolveSymbolLookup(event);
    default:
      throw `Unexpected query "${event.info.fieldName}" found.`;
  }
};

const resolveHelloWorld = (event: AppSyncResolverEvent<Query>): string => {
  return `Hello world at ${new Date().toISOString()}!`;
};
const resolveSymbolLookup = (event: AppSyncResolverEvent<Query>): Stock => {
  console.log('====> Event.info:', JSON.stringify(event.info, null, 2));
  console.log(
    '====> Event.arguments:',
    JSON.stringify(event.arguments, null, 2),
  );
  return {
    name: 'Apple',
    symbol: 'AAPL',
  } as Stock;
};
