import { Connection, createConnection, getConnectionOptions } from 'typeorm';

export default async (host = 'fin_api'): Promise<Connection> => {
  const defaultOptions = await getConnectionOptions();

  const isTestEnv = process.env.NODE_ENV === 'test';

  return createConnection(
    Object.assign(defaultOptions, {
      host: isTestEnv ? 'localhost' : host,
      database: isTestEnv ? 'fin_api_test' : defaultOptions.database,
    })
  );
};
