import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class ZohoAuthService {
  private readonly authUrl: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;
  private readonly refreshToken: string;
  private accessToken: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.authUrl = this.configService.get<string>('ZOHO_API_URL_AUTH');
    this.clientId = this.configService.get<string>('ZOHO_CLIENT_ID');
    this.clientSecret = this.configService.get<string>('ZOHO_CLIENT_SECRET');
    this.redirectUri = this.configService.get<string>('ZOHO_REDIRECT_URI');
    this.refreshToken = this.configService.get<string>('ZOHO_REFRESH_TOKEN');
    this.accessToken = '';
  }

  public async fetchAccessToken(): Promise<string> {
    const url = this.authUrl;
    const params = new URLSearchParams();
    params.append('refresh_token', this.refreshToken);
    params.append('client_id', this.clientId);
    params.append('client_secret', this.clientSecret);
    params.append('redirect_uri', this.redirectUri);
    params.append('grant_type', 'refresh_token');

    try {
      const response: AxiosResponse = await lastValueFrom(
        this.httpService.post(url, params),
      );
      console.log('response.data', response.data);
      this.accessToken = response.data.access_token;
      return this.accessToken;
    } catch (error) {
      throw new HttpException(
        'Failed to fetch access token',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  public getAccessToken(): string {
    return this.accessToken;
  }
}
