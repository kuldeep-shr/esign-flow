import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ZohoAuthService } from './zoho-auth.service';
import {
  GetEsignTagsDto,
  SubmitEsignResponseDto,
} from './dto/get-esign-tags.dto';
import * as FormData from 'form-data';
import axios from 'axios';

@Injectable()
export class ZohoService {
  constructor(
    private readonly httpService: HttpService,
    private readonly zohoAuthService: ZohoAuthService,
  ) {}

  public async getEsignTags(): Promise<GetEsignTagsDto> {
    let accessToken = this.zohoAuthService.getAccessToken();

    if (!accessToken) {
      accessToken = await this.zohoAuthService.fetchAccessToken();
    }
    const url = 'https://sign.zoho.in/api/v1/fieldtypes';

    try {
      const response = await this.httpService
        .get(url, {
          headers: {
            Authorization: `Zoho-oauthtoken ${accessToken}`,
          },
        })
        .toPromise();
      return { tags: response.data };
    } catch (error) {
      if (error.response && error.response.status === 401) {
        accessToken = await this.zohoAuthService.fetchAccessToken();
        return this.getEsignTags();
      } else {
        throw new HttpException(
          'Failed to fetch eSign tags',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  public async submitForEsign(
    file: Express.Multer.File,
    requestBody: any,
  ): Promise<SubmitEsignResponseDto> {
    try {
      const esignTags = requestBody.tags;

      let accessToken = this.zohoAuthService.getAccessToken();

      if (!accessToken) {
        accessToken = await this.zohoAuthService.fetchAccessToken();
      }

      // Prepare data for the first API call
      const actionsJson: any = {
        recipient_name: 'Dummy',
        recipient_email: 'dummy@email.in',
        action_type: 'SIGN',
        private_notes: 'Please get back to us for further queries',
        signing_order: 0,
        verify_recipient: true,
        verification_type: 'EMAIL',
        is_embedded: true,
      };

      const documentJson = {
        request_name: 'Alak',
        expiration_days: 1,
        is_sequential: true,
        email_reminders: true,
        reminder_period: 8,
        actions: [actionsJson],
      };

      const data = { requests: documentJson };

      const payload = new FormData();
      payload.append('file', file.buffer, { filename: file.originalname });
      payload.append('data', JSON.stringify(data));

      const HEADERS = {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
        ...payload.getHeaders(),
      };

      const URL = 'https://sign.zoho.in/api/v1/requests';

      // Make the first API call
      const response = await axios.post(URL, payload, {
        headers: HEADERS,
      });
      const responseData: any = response.data;
      const request_id = responseData.requests.request_id;
      const action_id = responseData.requests.actions[0].action_id;

      // Prepare data for the second API call
      const actionsJson1: any = {
        action_id: action_id,
        recipient_name: responseData.requests.actions[0].recipient_name,
        recipient_email: responseData.requests.actions[0].recipient_email,
        action_type: responseData.requests.actions[0].action_type,
      };

      const extractEsignTags = JSON.parse(esignTags);
      // Modify fieldJson based on selected eSign tags
      const fields = extractEsignTags.map((tag: any) => ({
        document_id: responseData.requests.document_ids[0].document_id,
        field_name: tag.field_type_name,
        field_type_name: tag.field_type_name,
        field_label: `${tag.field_type_name} - 1`,
        field_category: tag.field_category,
        abs_width: '200',
        abs_height: '18',
        is_mandatory: tag.is_mandatory,
        x_coord: '30',
        y_coord: '30',
        page_no: 0,
      }));

      actionsJson1['fields'] = fields;
      const documentJson1 = { actions: [actionsJson1] };
      const data1 = { requests: documentJson1 };

      const payload1 = new FormData();
      payload1.append('data', JSON.stringify(data1));
      const URL1 = `https://sign.zoho.in/api/v1/requests/${request_id}/submit`;

      // Make the second API call
      await axios.post(URL1, payload1, {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
          ...payload1.getHeaders(),
        },
      });

      // Prepare data for the third API call
      const payload2 = new FormData();
      payload2.append('host', 'https://sign.zoho.in');
      const URL2 = `https://sign.zoho.in/api/v1/requests/${request_id}/actions/${action_id}/embedtoken`;

      // Make the third API call
      const response2 = await axios.post(URL2, payload2, {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
          ...payload2.getHeaders(),
        },
      });
      const responseData2: any = response2.data;

      // Return the sign URL from the third API call
      return {
        message: 'document has successfully send for the signature',
        url: responseData2.sign_url,
      };
    } catch (error) {
      throw new Error('Failed to submit for eSign');
    }
  }
}
