// event.controller.spec.ts
import { Request, Response } from 'express';
import { post } from '../../src/controllers/event.controller';
import { createApiRoot } from '../../src/client/create.client';
import { visionClient, genAI, model } from '../../src/config/ai.config';
import { productAnalysis } from '../../src/services/Vision AI/productAnalysis.service';
import { generateProductDescription } from '../../src/services/Generative AI/descriptionGeneration.service';
import { createProductCustomObject } from '../../src/repository/Custom Object/createCustomObject.repository';
import { updateCustomObjectWithDescription } from '../../src/repository/Custom Object/updateCustomObjectWithDescription';

// Mock modules
jest.mock('../../src/client/create.client');
jest.mock('../../src/config/ai.config');
jest.mock('../../src/services/Vision AI/productAnalysis.service');
jest.mock('../../src/services/Generative AI/descriptionGeneration.service');
jest.mock('../../src/repository/Custom Object/createCustomObject.repository');
jest.mock('../../src/repository/Custom Object/updateCustomObjectWithDescription');

jest.mock('../../src/utils/config.utils.ts', () => ({
    readConfiguration: jest.fn().mockReturnValue({
        CTP_CLIENT_ID: "XXXXXXXXXXXXXXXXXXXXXXXX",
        CTP_CLIENT_SECRET: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
        CTP_PROJECT_KEY: "test-scope",
        CTP_SCOPE: "manage_project:test-scope",
        CTP_REGION: "europe-west1.gcp"
    })
}));

// Mock environment variable reading
jest.mock('../../src/config/ai.config.ts', () => ({
    BASE64_ENCODED_GCP_SERVICE_ACCOUNT: 'XXXXXXXXXX',
    GENERATIVE_AI_API_KEY: 'XXXXXXXXXX',
    GEMINI_MODEL: 'XXXXXXXXXX',
    visionClient: {
        annotateImage: jest.fn().mockResolvedValue([
            {
                labelAnnotations: [{ description: 'label1' }, { description: 'label2' }],
                localizedObjectAnnotations: [{ name: 'object1' }, { name: 'object2' }],
                imagePropertiesAnnotation: {
                    dominantColors: {
                        colors: [
                            { color: { red: 255, green: 255, blue: 255 } },
                            { color: { red: 0, green: 0, blue: 0 } },
                            { color: { red: 128, green: 128, blue: 128 } }
                        ]
                    }
                },
                textAnnotations: [{ description: 'detected text' }],
                webDetection: {
                    webEntities: [{ description: 'entity1' }, { description: 'entity2' }]
                }
            }
        ])
    },
    genAI: {
        getGenerativeModel: jest.fn().mockReturnValue({
            generateContent: jest.fn().mockResolvedValue({
                response: {
                    text: () => 'generated description'
                }
            })
        })
    },
    model: {
        generateContent: jest.fn().mockResolvedValue({
            response: {
                text: () => 'generated description'
            }
        })
    }
}));

describe('Event Controller Integration Tests', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    const mockStatus = jest.fn().mockReturnThis();
    const mockSend = jest.fn().mockReturnThis();

    beforeEach(() => {
        jest.clearAllMocks();
        mockRequest = {
            body: {
                message: {
                    data: Buffer.from(JSON.stringify({
                        productProjection: {
                            id: 'mockProductId',
                            masterVariant: {
                                images: [{ url: 'mockImageUrl' }],
                                attributes: [
                                    { name: 'generateDescription', value: true }
                                ]
                            },
                            name: { en: 'Mock Product' }
                        }
                    })).toString('base64')
                }
            }
        };
        mockResponse = {
            status: mockStatus,
            send: mockSend
        };
    });

    describe('Successful scenarios', () => {
        test('should process the event message successfully', async () => {
            // Arrange
            (createApiRoot as jest.Mock).mockReturnValue({
                customObjects: () => ({
                    post: jest.fn().mockResolvedValue({}),
                    withContainerAndKey: () => ({
                        get: jest.fn().mockResolvedValue({ body: { version: 1 } })
                    })
                })
            });
            (productAnalysis as jest.Mock).mockResolvedValue({
                labels: 'label1, label2',
                objects: 'object1, object2',
                colors: ['255, 255, 255', '0, 0, 0', '128, 128, 128'],
                detectedText: 'detected text',
                webEntities: 'entity1, entity2'
            });
            (generateProductDescription as jest.Mock).mockResolvedValue('generated description');
            (createProductCustomObject as jest.Mock).mockResolvedValue({});
            (updateCustomObjectWithDescription as jest.Mock).mockResolvedValue({});

            // Act
            await post(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockStatus).toHaveBeenCalledWith(200);
            expect(mockSend).toHaveBeenCalledWith({
                productId: 'mockProductId',
                productName: 'Mock Product',
                imageUrl: 'mockImageUrl',
                description: 'generated description',
                productAnalysis: {
                    labels: 'label1, label2',
                    objects: 'object1, object2',
                    colors: ['255, 255, 255', '0, 0, 0', '128, 128, 128'],
                    detectedText: 'detected text',
                    webEntities: 'entity1, entity2'
                }
            });
            expect(createProductCustomObject).toHaveBeenCalledWith('mockProductId', 'mockImageUrl', 'Mock Product');
            expect(updateCustomObjectWithDescription).toHaveBeenCalledWith('mockProductId', 'Mock Product', 'mockImageUrl', 'generated description');
        });
    });

    describe('Error scenarios', () => {
        test('should handle errors during product analysis and description generation', async () => {
            // Arrange
            (productAnalysis as jest.Mock).mockRejectedValue(new Error('Vision AI analysis failed'));
            (generateProductDescription as jest.Mock).mockRejectedValue(new Error('Generative AI description generation failed'));
          
            // Act
            try {
              await post(mockRequest as Request, mockResponse as Response);
            } catch (error) {
              // Assert
              expect(mockStatus).toHaveBeenCalledWith(500);
              expect(mockSend).toHaveBeenCalledWith({
                error: '❌ Internal server error. Failed to process request.',
                details: expect.any(String),
              });
            }
          });
    });
});
