import { createApiRoot } from '../../client/create.client';
import { logger } from '../../utils/logger.utils';

export async function updateCustomObjectWithDescription(productId: string, productName: string, imageUrl: string, description: string) {
    try {
        const apiRoot = createApiRoot();

        logger.info(`✅ Fetching custom object for product ID: ${productId} to get current version.`);
        
        const customObjectResponse = await apiRoot.customObjects().withContainerAndKey({
            container: "temporaryDescription",
            key: productId
        }).get().execute();

        const currentCustomObject = customObjectResponse?.body;

        if (!currentCustomObject) {
            throw new Error(`❌ Custom object not found for product ID: ${productId}`);
        }

        const currentVersion = currentCustomObject.version;

        logger.info(`✅ Updating custom object for product ID: ${productId} with generated description, imageUrl, and productName.`);
        
        const updateResponse = await apiRoot.customObjects().post({
            body: {
                container: "temporaryDescription",
                key: productId,
                version: currentVersion, 
                value: {
                    temporaryDescription: description,
                    imageUrl: imageUrl,
                    productName: productName,
                    generatedAt: new Date().toISOString()
                }
            }
        }).execute();

        logger.info(`✅ Custom object updated successfully for product ID: ${productId}.`);
        return updateResponse;

    } catch (error: any) {
        logger.error(`❌ Failed to update custom object for product ID: ${productId}`, { message: error.message });
        throw error;
    }
}
