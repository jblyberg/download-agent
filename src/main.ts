import { NestFactory } from '@nestjs/core';
import { AppModule } from './AppModule/AppModule';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  await app.init();
}
bootstrap();
