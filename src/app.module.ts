import { Module } from '@nestjs/common';
import { ZohoModule } from './zoho/zoho.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot(), ZohoModule],
})
export class AppModule {}
