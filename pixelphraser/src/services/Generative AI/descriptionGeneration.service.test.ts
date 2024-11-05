
// tests/services/descriptionGeneration.service.test.ts
import { generateProductDescription } from './descriptionGeneration.service';
import { model } from '../../config/ai.config';

jest.mock('../../../src/config/ai.config');
jest.mock('../../../src/utils/logger.utils');

describe('Description Generation Service', () => {
  const mockImageData = {
    labels: 'shirt, cotton',
    objects: 'clothing, apparel',
    colors: ['255, 255, 255'],
    detectedText: 'brand name',
    webEntities: 'fashion, style'
  };

  beforeEach(() => {
    (model.generateContent as jest.Mock).mockReset();
  });

  it('should generate description successfully', async () => {
    const mockGeneratedText = 'This is a generated product description';
    (model.generateContent as jest.Mock).mockResolvedValue({
      response: { text: () => mockGeneratedText }
    });

    const result = await generateProductDescription(mockImageData);

    expect(result).toBe(mockGeneratedText);
    expect(model.generateContent).toHaveBeenCalled();
  });

  it('should handle null response', async () => {
    (model.generateContent as jest.Mock).mockResolvedValue(null);

    await expect(generateProductDescription(mockImageData))
      .rejects.toThrow('❌ Generative AI response is null or undefined.');
  });

  it('should handle API errors', async () => {
    (model.generateContent as jest.Mock).mockRejectedValue(new Error('API Error'));

    await expect(generateProductDescription(mockImageData))
      .rejects.toThrow('API Error');
  });
});
