# AvaReg On-Chain Agent

B2C regulated distribution layer for tokenized financial assets in LatAm.

AvaReg helps a retail investor discover a simulated Argentina ON or Mexico IFC product, complete profiling, run a Wavy Node-style wallet risk check, and route an access request to the responsible regulated institution. Avalanche Fuji records referral evidence and permissioned secondary transfer decisions.

This repository is a hackathon MVP and sandbox. It is not a public offering, broker, custodian, PSAV, ALyC, casa de bolsa, IFC, exchange or legal opinion.

## Demo Flows

1. Argentina tokenized ON referral: investor profile, suitability hash, Wavy low-risk score, referral routed to simulated ALyC/PSAV.
2. Mexico IFC participation referral: country adapter, IFC-style product, Wavy review score, referral pending compliance review.
3. Secondary transfer gate: clean buyer allowed; risky buyer blocked with `SUSPICIOUS_ACTIVITY`.

## Sprint Phases

| Sprint | Output |
| --- | --- |
| 0 - Framing | Scope frozen as On-Chain Agent, Argentina/Mexico demos, Wavy gate, Fuji target. |
| 1 - Contracts foundation | `InvestorRegistry`, `InstitutionRegistry`, `ProductRegistry`, `ReferralRegistry`. |
| 2 - Compliance and risk | Wavy Node API adapter, `RiskOracle`, `OnChainAgentCompliance` with allow/review/block reasons. |
| 3 - Product templates | Argentina ON and Mexico IFC product model. |
| 4 - B2C frontend | Marketplace, investor profile, wallet risk check and referral flow. |
| 5 - Secondary transfer | `PermissionedTransfer` with clean/risky buyer scenes. |
| 6 - Demo hardening | README, demo script, architecture docs and Fuji deploy path. |

## Contracts

- `contracts/onchain-agent/InvestorRegistry.sol`: country, risk profile, KYC flag, suitability hash and active investor status.
- `contracts/onchain-agent/InstitutionRegistry.sol`: responsible institution type, country, registry ID hash and active flag.
- `contracts/onchain-agent/ProductRegistry.sol`: country-specific product rules, responsible institution and document hash.
- `contracts/onchain-agent/RiskOracle.sol`: Wavy score, risk level, suspicious activity flag and report hash.
- `contracts/onchain-agent/ReferralRegistry.sol`: referral evidence, institution route, disclosure hash and decision status.
- `contracts/onchain-agent/OnChainAgentCompliance.sol`: `ALLOW`, `REVIEW` or `BLOCK` with reason codes.
- `contracts/onchain-agent/TokenizedInstrument.sol`: demo position token controlled by authorized institutions.
- `contracts/onchain-agent/PermissionedTransfer.sol`: buyer/seller checks before moving a demo position.

Legacy MVP contracts from the previous institutional-market version remain under `contracts/registry`, `contracts/compliance`, `contracts/instruments`, `contracts/distribution` and `contracts/mocks`.

## Why Avalanche

The MVP targets Avalanche Fuji C-Chain for fast EVM delivery:

- Chain ID: `43113`
- RPC: `https://api.avax-test.network/ext/bc/C/rpc`
- Explorer: `https://subnets-test.avax.network/c-chain`

The roadmap is Avalanche L1-ready for permissioned validators, deployer/transactor allowlists, private institutional workflows and custom operating rules.

## Why Wavy Node

Wavy is in the decision path, not decoration. The local server keeps the API key out of the browser and calls Wavy Node directly:

1. `POST /v1/projects/{projectId}/addresses` registers the wallet with `foreign_user_id`.
2. `GET /v1/projects/{projectId}/addresses/scan-risk?addresses={wallet}&chainId={chainId}` returns the risk result.
3. The frontend uses the returned `riskScore`, `riskLevel`, `riskReason`, `suspiciousActivity`, `analysisId` and a local `reportHash`.

- Score `0-39`: allow if other product rules pass.
- Score `40-59`: manual review.
- Score `60-79`: block/review escalation.
- Score `80-100` or suspicious activity: block automatically.

Required `.env` values:

```bash
WAVYNODE_API_KEY="ApiKey wavy_your_api_key_here"
WAVYNODE_PROJECT_ID="your_project_id"
WAVYNODE_BASE_URL="https://api.wavynode.com/v1"
WAVYNODE_CHAIN_ID=43113
WAVYNODE_REGISTER_ADDRESSES=true
WAVYNODE_INTEGRATION_SECRET=32_character_hex_secret
```

The same server also exposes Wavy integration endpoints:

- `GET /users/{foreign_user_id}` for compliance user data.
- `POST /webhook` for real-time alerts.

Both routes verify `x-wavynode-hmac` and `x-wavynode-timestamp` with HMAC-SHA256 when `WAVYNODE_INTEGRATION_SECRET` or `SECRET` is configured.

See `docs/wavynode-integration.md` for implementation details.

## Run

```bash
npm install
npm run compile
npm test
```

If PowerShell blocks `npm`, use:

```powershell
npm.cmd install
npm.cmd run compile
npm.cmd test
```

Open the static demo directly:

```text
frontend/index.html
```

For the real Wavy integration, run the local server instead:

```powershell
npm.cmd run frontend
```

Then open `http://localhost:3000`. Opening the HTML file directly cannot call `/api/wavy/scan`.

## Fuji Deploy

```bash
copy .env.example .env
# Fill PRIVATE_KEY with a Fuji-funded key.
npm run deploy:fuji
npm run seed:fuji
```

## Limitations

- No real public offering, custody, brokerage, order execution or client asset handling.
- Simulated instruments only; Wavy screening uses the real Wavy Node API when credentials are configured.
- PII stays off-chain; contracts store hashes and status.
- Argentina and Mexico are separate country adapters, not one generalized LatAm legal regime.
- Production deployment requires legal structuring, licensed partners, audit, monitoring and security operations.
