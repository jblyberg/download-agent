import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { WatcherModule } from './WatcherModule/WatcherModule';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(WatcherModule);

  const logger = new Logger('Bootstrap');

  await app.init();

  logger.log('Download agent ready.');
}
bootstrap();
