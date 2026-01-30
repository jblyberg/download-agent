import { NestFactory } from '@nestjs/core';
import { WatcherModule } from './WatcherModule/WatcherModule';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(WatcherModule);
  await app.init();
}
bootstrap();
