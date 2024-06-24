import { Test, TestingModule } from '@nestjs/testing';
import { ZohoService } from './zoho.service';
import { HttpService } from '@nestjs/axios';
import { ZohoAuthService } from './zoho-auth.service';
import { of, throwError } from 'rxjs';
import { HttpException } from '@nestjs/common';
import axios from 'axios';

import { readFileSync } from 'fs';

jest.mock('axios');

describe('ZohoService', () => {
  let service: ZohoService;
  let httpService: HttpService;
  let zohoAuthService: ZohoAuthService;
  let authService: ZohoAuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ZohoService,
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: ZohoAuthService,
          useValue: {
            getAccessToken: jest.fn(),
            fetchAccessToken: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ZohoService>(ZohoService);
    httpService = module.get<HttpService>(HttpService);
    zohoAuthService = module.get<ZohoAuthService>(ZohoAuthService);
  });

  describe('getEsignTags', () => {
    it('should return eSign tags', async () => {
      const mockAccessToken = 'test-access-token';
      const mockTagsResponse: any = {
        data: {
          tags: {
            field_types: [
              {
                field_type_id: '66919000000000173',
                field_category: 'checkbox',
                is_mandatory: false,
                field_type_name: 'Checkbox',
              },
            ],
            code: 0,
            message: 'Field types retrieved successfully',
            status: 'success',
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      };

      jest
        .spyOn(authService, 'getAccessToken')
        .mockReturnValue(mockAccessToken);
      jest.spyOn(httpService, 'get').mockReturnValue(of(mockTagsResponse));

      const result: any = await service.getEsignTags();
      const extractData = {
        tags: {
          field_types: result.tags.field_types[0],
          code: result.tags.code,
          message: result.tags.message,
          status: result.tags.status,
        },
      };
      expect(extractData).toEqual({
        tags: {
          field_types: expect.any(Array),
          code: expect.any(Number),
          message: expect.any(String),
          status: expect.any(String),
        },
      });
      expect(extractData.tags.field_types[0]).toEqual({
        field_type_id: expect.any(String),
        field_category: expect.any(String),
        is_mandatory: expect.any(Boolean),
        field_type_name: expect.any(String),
      });
    });

    it('should handle errors', async () => {
      const mockError = new Error('Failed to fetch eSign tags');
      jest
        .spyOn(authService, 'getAccessToken')
        .mockReturnValue('test-access-token');
      jest.spyOn(httpService, 'get').mockReturnValue(throwError(mockError));

      await expect(service.getEsignTags()).rejects.toThrow(
        'Failed to fetch eSign tags',
      );
    });
  });

  describe('submitForEsign', () => {
    it('should submit a document for eSign and return the sign URL', async () => {
      const file: Express.Multer.File = {
        buffer: readFileSync('./sample-pdf'),
        originalname: 'kuldeep_sharma.pdf',
        mimetype: 'application/pdf',
      } as Express.Multer.File;
      const requestBody = {
        tags: JSON.stringify([
          {
            field_type_name: 'Signature',
            field_category: 'Signature',
            is_mandatory: true,
          },
        ]),
      };
      const accessToken = 'access_token';
      const newAccessToken = 'new_access_token';

      const response1 = {
        data: {
          requests: {
            request_id: 'request_id',
            actions: [
              {
                action_id: 'action_id',
                recipient_name: 'Dummy',
                recipient_email: 'dummy@email.in',
                action_type: 'SIGN',
              },
            ],
            document_ids: [{ document_id: 'document_id' }],
          },
        },
      };

      const response2 = {
        data: {
          sign_url: 'https://sign.zoho.in/sign-url',
        },
      };

      jest
        .spyOn(zohoAuthService, 'getAccessToken')
        .mockReturnValueOnce(accessToken)
        .mockReturnValueOnce(newAccessToken);
      jest
        .spyOn(zohoAuthService, 'fetchAccessToken')
        .mockResolvedValue(newAccessToken);
      (axios.post as jest.Mock).mockImplementation((url, data) => {
        if (url.includes('submit')) {
          return Promise.resolve(response1);
        } else if (url.includes('embedtoken')) {
          return Promise.resolve(response2);
        }
        return Promise.resolve(response1);
      });

      const result = await service.submitForEsign(file, requestBody);
      expect(result).toEqual({
        message: 'document has successfully send for the signature',
        url: response2.data.sign_url,
      });
    });

    it('should throw an error if submitting for eSign fails', async () => {
      const file: Express.Multer.File = {
        buffer: readFileSync('./sample-pdf'),
        originalname: 'kuldeep_sharma.pdf',
        mimetype: 'application/pdf',
      } as Express.Multer.File;
      const requestBody = {
        tags: JSON.stringify([
          {
            field_type_name: 'Signature',
            field_category: 'Signature',
            is_mandatory: true,
          },
        ]),
      };
      const accessToken = 'access_token';

      jest
        .spyOn(zohoAuthService, 'getAccessToken')
        .mockReturnValue(accessToken);
      (axios.post as jest.Mock).mockRejectedValue(
        new Error('Failed to submit'),
      );

      await expect(service.submitForEsign(file, requestBody)).rejects.toThrow(
        'Failed to submit for eSign',
      );
    });
  });
});
