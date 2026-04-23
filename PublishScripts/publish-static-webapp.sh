#!/usr/bin/env bash
set -euo pipefail

APP_NAME="spotify-to-youtube"
RESOURCE_GROUP="spotify-to-youtube_group"

echo "Updating Azure Static Web App metadata..."
az staticwebapp update -n "$APP_NAME" -g "$RESOURCE_GROUP" -o table

PROVIDER="$(az staticwebapp show -n "$APP_NAME" -g "$RESOURCE_GROUP" --query 'provider' -o tsv)"
if [[ "$PROVIDER" == "GitHub" ]]; then
	echo ""
	echo "ERROR: This Static Web App is linked to GitHub Actions."
	echo "Direct deploy via deployment token is blocked for GitHub-linked SWAs."
	echo ""
	echo "Use one of these options instead:"
	echo "  1. Push to the tracked branch and let GitHub Actions deploy"
	echo "  2. Unlink source control in Azure, then run this script"
	exit 1
fi

echo "Building production assets..."
npm run build

echo "Deploying build/ to Azure Static Web Apps production..."
echo "Fetching deployment token..."
DEPLOY_TOKEN="$(az staticwebapp secrets list -n "$APP_NAME" -g "$RESOURCE_GROUP" --query 'properties.apiKey' -o tsv | tr -d '[:space:]')"

if [[ -z "$DEPLOY_TOKEN" ]]; then
	echo "ERROR: Failed to retrieve deployment token. Check that:"
	echo "  1. You are logged in:           az login"
	echo "  2. Correct subscription active: az account show"
	echo "  3. APP_NAME='$APP_NAME' and RESOURCE_GROUP='$RESOURCE_GROUP' are correct"
	exit 1
fi

echo "Deploying build/ to Azure Static Web Apps production..."
npx -y @azure/static-web-apps-cli deploy "$(dirname "$0")/../build" --deployment-token "$DEPLOY_TOKEN" --env production

echo "Publish complete."
