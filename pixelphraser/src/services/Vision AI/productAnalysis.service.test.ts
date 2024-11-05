// tests/services/productAnalysis.service.test.ts
import { productAnalysis } from './productAnalysis.service';
import { visionClient } from '../../config/ai.config';

jest.mock('../../../src/config/ai.config');
jest.mock('../../../src/utils/logger.utils');

describe('Product Analysis Service', () => {
  const mockImageURL = 'https://test-image.jpg';

  beforeEach(() => {
    (visionClient.annotateImage as jest.Mock).mockReset();
  });

  it('should analyze image successfully', async () => {
    const mockVisionResponse = [{
      labelAnnotations: [{ description: 'label1' }, { description: 'label2' }],
      localizedObjectAnnotations: [{ name: 'object1' }, { name: 'object2' }],
      imagePropertiesAnnotation: {
        dominantColors: {
          colors: [
            { color: { red: 255, green: 0, blue: 0 } },
            { color: { red: 0, green: 255, blue: 0 } }
          ]
        }
      },
      textAnnotations: [{ description: 'detected text' }],
      webDetection: {
        webEntities: [{ description: 'entity1' }, { description: 'entity2' }]
      }
    }];

    (visionClient.annotateImage as jest.Mock).mockResolvedValue(mockVisionResponse);

    const result = await productAnalysis(mockImageURL);

    expect(result).toEqual({
      labels: 'label1, label2',
      objects: 'object1, object2',
      colors: ['255, 0, 0', '0, 255, 0'],
      detectedText: 'detected text',
      webEntities: 'entity1, entity2'
    });
  });

  it('should handle missing annotations', async () => {
    const mockVisionResponse = [{}];
    
    (visionClient.annotateImage as jest.Mock).mockResolvedValue(mockVisionResponse);

    const result = await productAnalysis(mockImageURL);

    expect(result).toEqual({
      labels: 'No labels detected',
      objects: 'No objects detected',
      colors: ['No colors detected'],
      detectedText: 'No text detected',
      webEntities: 'No web entities detected'
    });
  });

  it('should handle API errors', async () => {
    (visionClient.annotateImage as jest.Mock).mockRejectedValue(new Error('API Error'));

    await expect(productAnalysis(mockImageURL)).rejects.toThrow('API Error');
  });
});
