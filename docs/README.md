<p align="center">
  <a href="https://commercetools.com/">
    <img alt="commercetools logo" src="https://unpkg.com/@commercetools-frontend/assets/logos/commercetools_primary-logo_horizontal_RGB.png">
  </a></br>
  <a href="https://pixelphraser-ct-connector.s3.us-east-1.amazonaws.com/PixelPhraser.jpeg">
    <img alt="pixel-phraser-logo" src="https://pixelphraser-ct-connector.s3.us-east-1.amazonaws.com/PixelPhraser.jpeg">
  </a><br>
</p>

# PixelPhraser
## CommerceTools Connector for Product Description Generation
A connector that automatically generates SEO-optimized product descriptions for Commerce Tools. This service leverages CommerceTools' event architecture, Google Cloud Vision AI for image analysis, and Google's Generative AI (Gemini) for natural language generation.

## About the Connector
### Event Application: 
This application processes product events, analyzes product images using Google Vision AI, generates product descriptions using Generative AI, and updates the product descriptions in Commerce Tools.

This event-driven application is triggered by notifications generated whenever a product is published. It performs the following tasks:

1. Analyzes the product image using Google Vision AI.
2. Generates a compelling product description based on the image analysis using Google Generative AI.
3. Updates the product description in Commerce Tools.

## Prerequisites
To install and use the CommerceTools Connector, you will need the following accounts and credentials:
- **Commercetools Account**
- **Commercetools API Keys** (specifically for the "Admin client")
- **Google Cloud Platform Account** (gcp service account with permission to Vison AI and Generative AI)

To create an API Client in the Merchant Center, go to **Settings > Developer settings > Create new API client**. Take note of the following:

- `CTP_PROJECT_KEY`
- `CTP_CLIENT_SECRET`
- `CTP_CLIENT_ID`
- `CTP_AUTH_URL`
- `CTP_API_URL`
- `CTP_SCOPE`
- `CTP_REGION`

Additionally, you will need the following Google Cloud Platform credentials:
- `BASE64_ENCODED_GCP_SERVICE_ACCOUNT`
- `GEMINI_MODEL`
- `GENERATIVE_AI_API_KEY`

## Installing the Connector
Deploy this  Connector into any project to learn and experience how commercetools Connect makes integrations quick and easy. Follow the steps from the commercetools connect deployment documentation.

### Configurations:
#### Sample Environment Variables
  ```env
# Required Environment Variables
# Commerce Tools Credentials
CTP_PROJECT_KEY=your_project_key
CTP_CLIENT_SECRET=your_client_secret
CTP_CLIENT_ID=your_client_id
CTP_AUTH_URL=https://auth.commercetools.com/oauth/token
CTP_API_URL=https://api.commercetools.com
CTP_SCOPE=manage_project
CTP_REGION=us-central1

# Google Cloud Platform Credentials
BASE64_ENCODED_GCP_SERVICE_ACCOUNT=your_base64_encoded_service_account
GEMINI_MODEL=your_gemini_model
GENERATIVE_AI_API_KEY=your_api_key
```

## How to Uninstall
To uninstall the connector, either send a DELETE request using the API or simply uninstall it from the Merchant Center.

## Running the Application
To run the application locally, follow these steps:
* clone the repository
* `cd poc-commercetools-connector/pixelphraser`
* run `yarn install` to install the dependencies
* insert commercetools and gcp credentials to `.env` file
* run `ỳarn start:dev` to build the application

Please refer to the [Commercetools connect deployment documentation](https://docs.commercetools.com/deployment) for detailed instructions.