import { productAnalysis } from '../../../src/services/Vision AI/productAnalysis.service';
import { visionClient } from '../../../src/config/ai.config';
import { logger } from '../../../src/utils/logger.utils';

jest.mock('../../../src/config/ai.config', () => ({
    visionClient: {
        annotateImage: jest.fn()
    }
}));
jest.mock('../../../src/utils/logger.utils');

describe('Product Analysis Service Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should analyze image successfully', async () => {
        // Arrange
        const mockAnnotateResponse = [{
            labelAnnotations: [{ description: 'shirt' }],
            localizedObjectAnnotations: [{ name: 'clothing' }],
            imagePropertiesAnnotation: {
                dominantColors: {
                    colors: [{ color: { red: 255, green: 255, blue: 255 } }]
                }
            },
            textAnnotations: [{ description: 'brand' }],
            webDetection: {
                webEntities: [{ description: 'fashion' }]
            }
        }];

        (visionClient.annotateImage as jest.Mock).mockResolvedValue(mockAnnotateResponse);

        // Act
        const result = await productAnalysis('test-url');

        // Assert
        expect(result).toEqual({
            labels: 'shirt',
            objects: 'clothing',
            colors: ['255, 255, 255'],
            detectedText: 'brand',
            webEntities: 'fashion'
        });
    });
});