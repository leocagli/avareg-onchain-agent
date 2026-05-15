# Wavy Node Integration

AvaReg uses Wavy Node as a real server-side risk provider.

## Outbound API

The local server exposes `POST /api/wavy/scan` for the frontend. That endpoint:

1. Validates the EVM wallet address.
2. Registers the address in Wavy Node with `POST /v1/projects/{projectId}/addresses`.
3. Sends `foreign_user_id` so Wavy can match the wallet to AvaReg's user record.
4. Calls `GET /v1/projects/{projectId}/addresses/scan-risk?addresses={wallet}&chainId={chainId}`.
5. Returns normalized `riskScore`, `riskLevel`, `riskReason`, `suspiciousActivity`, `analysisId`, `patternsDetected` and a local `reportHash`.

The browser never sees `WAVYNODE_API_KEY`.

## Required Environment

```bash
WAVYNODE_API_KEY="ApiKey wavy_your_api_key_here"
WAVYNODE_PROJECT_ID="your_project_id"
WAVYNODE_BASE_URL="https://api.wavynode.com/v1"
WAVYNODE_CHAIN_ID=43113
WAVYNODE_REGISTER_ADDRESSES=true
WAVYNODE_INTEGRATION_SECRET=615d9b7ea991acfa33f823c374c3a062
```

The `ApiKey ` prefix is required by Wavy Node.

## Inbound Integration Routes

Wavy Node expects one integration base URL with:

- `GET /users/{foreign_user_id}`
- `POST /webhook`

Both routes verify:

- `x-wavynode-hmac`
- `x-wavynode-timestamp`

The signature is HMAC-SHA256 over:

```text
METHOD::/lowercase-path::sorted-json-body::timestamp
```

Requests outside a five-minute tolerance are rejected.

## On-Chain Attestation

`RiskOracle` remains the on-chain destination for accepted Wavy results. A production operator/backend wallet should write the normalized Wavy result hash on-chain after the server receives a valid scan result.
